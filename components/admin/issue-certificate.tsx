'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { firebase } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { logCertificateIssued } from '@/lib/activity-service';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  photoURL?: string;
  enrolledCourses?: string[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  level?: string;
  enrolledStudents?: string[];
}

interface Enrollment {
  id: string;
  userId: string;
  courseId?: string;
  courseDetails?: {
    courseId?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface IssueCertificateProps {
  users: User[];
  courses: Course[];
  children?: React.ReactNode;
}

export function IssueCertificate({ users, courses, children }: IssueCertificateProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openUserCombobox, setOpenUserCombobox] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  // Local users list as a fallback if parent hasn't loaded users yet
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  
  // Keep local users in sync with prop
  useEffect(() => {
    if (users && users.length) {
      setLocalUsers(users);
    }
  }, [users]);

  // When dialog opens, if we still don't have users, fetch them directly
  useEffect(() => {
    const fetchUsersIfNeeded = async () => {
      if (!isOpen) return;
      if (localUsers.length > 0 || isUsersLoading) return;
      try {
        setIsUsersLoading(true);
        const snap = await getDocs(collection(firebase.db, 'users'));
        const fetched = snap.docs.map(d => ({
          id: d.id,
          email: (d.data() as any).email || '',
          displayName: (d.data() as any).displayName || '',
          role: (d.data() as any).role || undefined,
          photoURL: (d.data() as any).photoURL || undefined,
          enrolledCourses: (d.data() as any).enrolledCourses || []
        })) as User[];
        setLocalUsers(fetched);
      } catch (e) {
        console.error('Failed to fetch users for issuing certificate:', e);
        toast({
          title: 'Error',
          description: 'Could not load students list',
          variant: 'destructive',
        });
      } finally {
        setIsUsersLoading(false);
      }
    };
    fetchUsersIfNeeded();
  }, [isOpen, localUsers.length, isUsersLoading]);

  // Filter users to only show students (role strictly 'student', case-insensitive)
  const students = localUsers.filter(user => {
    const role = (user.role || '').toLowerCase();
    return role === 'student';
  });
  
  // Sort students alphabetically by display name (fallback to email)
  const studentsSorted = [...students].sort((a, b) => {
    const nameA = (a.displayName || a.email || '').toLowerCase();
    const nameB = (b.displayName || b.email || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
  
  // Debug effect (commented out but kept for future use)
  // useEffect(() => {
  //   console.log('All users:', users);
  //   console.log('Filtered students:', students);
  // }, [users, students]);

  // Fetch enrolled courses when user changes
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!selectedUserId) {
        console.log('No user selected, clearing courses');
        setEnrolledCourses([]);
        setSelectedCourseId('');
        return;
      }

      try {
        console.log(`Fetching enrollments for user: ${selectedUserId}`);
        
        // First, get the user document to check for direct course references
        const userDoc = await getDoc(doc(firebase.db, 'users', selectedUserId));
        console.log('User document data:', userDoc.data());
        
        // Then fetch enrollments for this user
        const enrollmentsQuery = query(
          collection(firebase.db, 'enrollments'),
          where('userId', '==', selectedUserId)
        );
        const snapshot = await getDocs(enrollmentsQuery);
        
        // Log all enrollment documents with their data
        const enrollments = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Raw enrollment ${doc.id}:`, data);
          return {
            id: doc.id,
            ...data
          } as Enrollment;
        });
        
        console.log('All enrollments for user:', JSON.stringify(enrollments, null, 2));
        
        // Extract course IDs from enrollments with detailed logging
        const enrolledCourseIds = enrollments.flatMap(enrollment => {
          // Log the full enrollment for debugging
          console.log('Processing enrollment:', JSON.stringify(enrollment, null, 2));
          
          // Check all possible locations for courseId
          const courseId = enrollment.courseId || // Direct property
                         (enrollment as any)?.courseDetails?.courseId || // Nested in courseDetails
                         (enrollment as any)?.course?.id || // Nested in course object
                         (enrollment as any)?.courseId; // Any other possible variation
          
          console.log(`Extracted course ID from enrollment:`, {
            enrollmentId: enrollment.id,
            courseId,
            courseTitle: (enrollment as any)?.courseTitle || 'N/A',
            enrollmentType: typeof enrollment
          });
          
          // Return the course ID as a trimmed string if it exists
          return courseId ? [String(courseId).trim()] : [];
        });
        
        console.log('Extracted course IDs from enrollments:', enrolledCourseIds);
        console.log('Available courses count:', courses.length);
        
        // Log all available course IDs for verification
        console.log('Available course IDs:', courses.map(c => c.id));
        
        // Log all courses for debugging
        console.log('All available courses:', JSON.stringify(courses, null, 2));
        
        // Filter courses to only show enrolled ones with type safety
        const userCourses = courses.filter(course => {
          // Convert course ID to both string and number for comparison
          const courseIdStr = String(course.id).trim();
          const courseIdNum = Number(course.id);
          
          // Check if any of the enrolled course IDs match this course
          const isEnrolled = enrolledCourseIds.some(enrolledId => {
            const enrolledIdStr = String(enrolledId).trim();
            const enrolledIdNum = Number(enrolledId);
            
            // Check for both string and number matches
            const match = enrolledIdStr === courseIdStr || 
                         (!isNaN(enrolledIdNum) && enrolledIdNum === courseIdNum);
            
            // Detailed logging for debugging
            console.log(`Course Matching - `, {
              enrolledCourseId: enrolledId,
              availableCourseId: course.id,
              enrolledIdType: typeof enrolledId,
              courseIdType: typeof course.id,
              match,
              courseTitle: course.title,
              comparison: {
                'enrolledId (str)': enrolledIdStr,
                'course.id (str)': courseIdStr,
                'enrolledId (num)': enrolledIdNum,
                'course.id (num)': courseIdNum
              }
            });
            
            return match;
          });
          
          console.log(`Course ${course.id} (${course.title}) enrolled:`, isEnrolled);
          return isEnrolled;
        });
        
        console.log('Filtered user courses:', JSON.stringify(userCourses, null, 2));
        
        if (userCourses.length === 0 && enrolledCourseIds.length > 0) {
          console.warn('No courses found matching the enrolled course IDs. This could indicate a data mismatch.');
          console.warn('Enrolled Course IDs:', enrolledCourseIds);
          console.warn('Available Course IDs:', courses.map(c => c.id));
        }
        
        setEnrolledCourses(userCourses);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load enrolled courses',
          variant: 'destructive',
        });
        setEnrolledCourses([]);
      }
    };

    fetchEnrolledCourses();
  }, [selectedUserId, courses]);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const handleFileUpload = async (
    file: File,
    attempt = 1
  ): Promise<{ fileUrl: string; storagePath: string }> => {
    if (!file || !selectedUserId) {
      toast({
        title: 'Error',
        description: 'No file or user selected',
        variant: 'destructive',
      });
      throw new Error('No file or user selected');
    }

    try {
      console.log(`Uploading certificate file (attempt ${attempt})...`);

      toast({
        title: 'Uploading Certificate',
        description: 'Please wait while your file is uploaded...',
        variant: 'default',
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', selectedUserId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa('admin:password')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      const data = await response.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Upload failed');
      }

      // The upload API now returns a serving URL based on the Firestore fileId
      // e.g. /api/files/{fileId} — this is a direct document lookup, no filesystem needed
      const fileUrl = data.fileUrl || `/api/files/${data.fileId}`;
      const storagePath = data.storagePath || fileUrl;

      toast({
        title: 'Upload Successful',
        description: 'Certificate file is ready for preview and download',
        variant: 'success',
      });

      return { fileUrl, storagePath };
    } catch (error: any) {
      console.error('Upload error:', error);

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying upload (${attempt + 1}/${MAX_RETRIES})...`);
        toast({
          title: 'Uploading',
          description: `Attempt ${attempt + 1} of ${MAX_RETRIES} - Please wait...`,
          variant: 'default',
        });

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        return handleFileUpload(file, attempt + 1);
      }

      toast({
        title: 'Error',
        description: error.message || 'Failed to upload the certificate file. Please try again.',
        variant: 'destructive',
      });

      throw error;
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedUserId || !selectedCourseId) {
      toast({
        title: 'Error',
        description: 'Please select both user and course',
        variant: 'destructive',
      });
      return;
    }
    
    if (!certificateFile) {
      toast({
        title: 'Error',
        description: 'Please upload the certificate file',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting certificate issuance process...');
      
      // 1. First, verify the user and course exist
      const [userDoc, courseDoc] = await Promise.all([
        getDoc(doc(firebase.db, 'users', selectedUserId)),
        getDoc(doc(firebase.db, 'courses', selectedCourseId))
      ]);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }
      
      // 2. Prepare certificate file for preview/download
      console.log('Preparing certificate file...');
      const uploadResult = await handleFileUpload(certificateFile);
      const fileUrl = uploadResult.fileUrl;
      const storagePath = uploadResult.storagePath;
      console.log('Certificate file ready:', storagePath);
      
      const certId = certificateId.trim() || `cert_${Date.now()}`;
      const issueDate = new Date().toISOString();
      
      // Get user and course data for activity log
      const user = localUsers.find(u => u.id === selectedUserId);
      const course = courses.find(c => c.id === selectedCourseId);
      const recipientEmail = userDoc.data()?.email || user?.email || '';
      const recipientName = userDoc.data()?.displayName || user?.displayName || recipientEmail.split('@')[0] || 'Unknown User';
      const courseTitle = courseDoc.data()?.title || course?.title || 'Unknown Course';

      // Create certificate document in Firestore with consistent fields
      const verificationCode = `CERT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const certificateData = {
        id: certId,
        certificateId: certId,
        certificateNumber: certId,
        userId: selectedUserId,
        userName: recipientName,
        userEmail: recipientEmail,
        recipientName,
        recipientEmail,
        courseId: selectedCourseId,
        courseTitle,
        courseName: courseTitle,
        issueDate,
        completionDate: issueDate,
        certificateUrl: fileUrl,
        previewUrl: fileUrl,
        fileUrl,
        filePath: storagePath,
        storagePath,
        status: 'issued',
        remarks: remarks.trim() || '',
        verificationCode,
        metadata: {
          verificationCode,
          remarks: remarks.trim() || '',
        },
        createdAt: issueDate,
      };

      const certificateRef = doc(collection(firebase.db, 'certificates'), certId);
      await setDoc(certificateRef, certificateData, { merge: true });

      // Log the certificate issuance activity with the actual certificate ID
      if (user && course) {
        try {
          await logCertificateIssued(
            user.id,
            recipientName,
            recipientEmail,
            course.id,
            course.title,
            certId
          );
        } catch (error) {
          console.error('Failed to log certificate issuance activity:', error);
          // Don't fail the whole operation if activity logging fails
        }
      }

      console.log('Updating user document...');
      const userRef = doc(firebase.db, 'users', selectedUserId);
      await updateDoc(userRef, {
        certificates: arrayUnion({
          ...certificateData,
          certificateId: certId,
        }),
      });
      console.log('User document updated');

      // 5. Update course's issued certificates
      console.log('Updating course document...');
      const courseRef = doc(firebase.db, 'courses', selectedCourseId);
      await updateDoc(courseRef, {
        issuedCertificates: arrayUnion({
          userId: selectedUserId,
          userName: recipientName,
          certificateId: certId,
          issueDate,
          remarks: remarks || '',
          fileUrl,
          status: 'issued'
        })
      });
      console.log('Course document updated');

      console.log('Certificate document created');

      toast({
        title: 'Success',
        description: 'Certificate issued successfully',
      });
      
      // Reset form
      setIsOpen(false);
      setSelectedUserId('');
      setSelectedCourseId('');
      setCertificateId('');
      setCertificateFile(null);
      setRemarks('');
    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue certificate',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUserDisplay = selectedUserId 
    ? (() => {
        const u = students.find(u => u.id === selectedUserId);
        if (!u) return "Select a student";
        const name = u.displayName || 'Unnamed';
        return u.email ? `${name} (${u.email})` : name;
      })()
    : (students.length > 0 ? "Select a student" : "No students available");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || <Button>Issue Certificate</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle className="text-2xl font-bold">Issue New Certificate</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="user" className="text-base">Select Student</Label>
            <div className="space-y-2">
              <Popover open={openUserCombobox} onOpenChange={setOpenUserCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    id="user"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUserCombobox}
                    disabled={isLoading}
                    className="w-full justify-between font-normal h-12 text-base"
                  >
                    <span className="truncate">{selectedUserDisplay}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search students by name or email..." />
                    <CommandList>
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {studentsSorted.map((user) => {
                          const name = user.displayName || 'Unnamed';
                          const email = user.email || '';
                          const display = email ? `${name} (${email})` : name;
                          return (
                            <CommandItem
                              key={user.id}
                              value={display}
                              onSelect={() => {
                                setSelectedUserId(user.id);
                                setOpenUserCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {display}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No students found. Make sure users have the 'student' role.
                </p>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Found {students.length} student{students.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Course Selection */}
          {selectedUserId && (
            <div className="space-y-2">
              <Label htmlFor="course" className="text-base">Select Course</Label>
              <Select 
                value={selectedCourseId} 
                onValueChange={setSelectedCourseId}
                disabled={isLoading || !enrolledCourses.length}
              >
                <SelectTrigger id="course" className="h-12 w-full min-w-0 text-base">
                  <SelectValue placeholder={
                    enrolledCourses.length 
                      ? "Select a course" 
                      : "No enrolled courses found"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-72 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  {enrolledCourses.map(course => (
                    <SelectItem key={course.id} value={course.id} className="[&_span:last-child]:truncate">
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload */}
          {selectedCourseId && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="certificateFile" className="text-base">Certificate File</Label>
                <div className="flex min-w-0 items-center gap-4">
                  <Input
                    id="certificateFile"
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                    className="h-12 w-full min-w-0"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload the certificate file (PDF or Image)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-base">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any additional notes about this certificate"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={isLoading}
                  className="min-h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateId" className="text-base">Certificate ID</Label>
                <Input
                  id="certificateId"
                  placeholder="Leave blank to auto-generate an ID"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
                <p className="text-sm text-muted-foreground">
                  {certificateId ? `Using custom ID: ${certificateId}` : 'A unique ID will be generated automatically'}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleIssueCertificate}
                  disabled={isLoading || !selectedUserId || !selectedCourseId}
                >
                  {isLoading ? 'Issuing...' : 'Issue Certificate'}
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
