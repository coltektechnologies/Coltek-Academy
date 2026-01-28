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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { logCertificateIssued } from '@/lib/activity-service';

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
        const snap = await getDocs(collection(db, 'users'));
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
        const userDoc = await getDoc(doc(db, 'users', selectedUserId));
        console.log('User document data:', userDoc.data());
        
        // Then fetch enrollments for this user
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
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

  const handleFileUpload = async (file: File, attempt = 1): Promise<string> => {
    if (!file || !selectedUserId) {
      toast({
        title: 'Error',
        description: 'No file or user selected',
        variant: 'destructive',
      });
      throw new Error('No file or user selected');
    }

    try {
      console.log(`Starting file upload attempt ${attempt}...`);
      
      // Show loading state
      toast({
        title: 'Uploading Certificate',
        description: 'Please wait while we process your file...',
        variant: 'default',
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', selectedUserId);
      
      // In production, use a more secure authentication method
      const authToken = Buffer.from('admin:password').toString('base64');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authToken}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Upload failed: ${error}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      
      console.log('File uploaded successfully:', data.filePath);
      
      // Show success toast
      toast({
        title: 'Upload Successful',
        description: 'Certificate has been uploaded successfully',
        variant: 'success',
      });
      
      return data.filePath;
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // If we have retries left, retry
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
      
      // Show error toast after all retries fail
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file. Please try again.',
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
        getDoc(doc(db, 'users', selectedUserId)),
        getDoc(doc(db, 'courses', selectedCourseId))
      ]);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }
      
      // 2. Upload certificate file
      console.log('Uploading certificate file...');
      const fileUrl = await handleFileUpload(certificateFile);
      console.log('File uploaded successfully:', fileUrl);
      
      const certId = certificateId || `cert_${Date.now()}`;
      const issueDate = new Date().toISOString();
      
      // Get user and course data for activity log
      const user = localUsers.find(u => u.id === selectedUserId);
      const course = courses.find(c => c.id === selectedCourseId);

      // Create certificate document in Firestore
      const certificateData = {
        userId: selectedUserId,
        courseId: selectedCourseId,
        issueDate: new Date().toISOString(),
        fileUrl: fileUrl,
        filePath: fileUrl,
        status: 'issued',
        remarks: remarks.trim() || null,
        certificateId: certificateId.trim() || null,
        createdAt: new Date().toISOString(),
      };

      const certificateRef = await addDoc(collection(db, 'certificates'), certificateData);

      // Log the certificate issuance activity
      if (user && course) {
        try {
          await logCertificateIssued(
            user.id,
            user.displayName || user.email.split('@')[0],
            user.email,
            course.id,
            course.title,
            certificateRef.id
          );
        } catch (error) {
          console.error('Failed to log certificate issuance activity:', error);
          // Don't fail the whole operation if activity logging fails
        }
      }

      console.log('Updating user document...');
      const userRef = doc(db, 'users', selectedUserId);
      await updateDoc(userRef, {
        certificates: arrayUnion(certificateData)
      });
      console.log('User document updated');

      // 5. Update course's issued certificates
      console.log('Updating course document...');
      const courseRef = doc(db, 'courses', selectedCourseId);
      await updateDoc(courseRef, {
        issuedCertificates: arrayUnion({
          userId: selectedUserId,
          userName: userDoc.data()?.displayName || userDoc.data()?.email || 'Unknown User',
          certificateId: certId,
          issueDate,
          remarks: remarks || '',
          fileUrl,
          status: 'issued'
        })
      });
      console.log('Course document updated');

      // 6. Create a new document in the certificates collection
      console.log('Creating certificate document...');
      const certRef = doc(collection(db, 'certificates'), certId);
      await setDoc(certRef, {
        ...certificateData,
        userId: selectedUserId,
        userName: userDoc.data()?.displayName || userDoc.data()?.email || 'Unknown User',
        courseTitle: courseDoc.data()?.title || 'Unknown Course'
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || <Button>Issue Certificate</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">Issue New Certificate</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="user" className="text-base">Select Student</Label>
            <div className="space-y-2">
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
                disabled={isLoading}
              >
                <SelectTrigger id="user" className="h-12 text-base">
                  <SelectValue placeholder={
                    students.length > 0 
                      ? "Select a student" 
                      : "No students available"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {studentsSorted.length > 0 ? (
                    studentsSorted.map(user => {
                      const name = user.displayName || 'Unnamed';
                      const email = user.email || '';
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {email ? `${name} (${email})` : name}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No students found in the system.
                    </div>
                  )}
                </SelectContent>
              </Select>
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
                <SelectTrigger id="course" className="h-12 text-base">
                  <SelectValue placeholder={
                    enrolledCourses.length 
                      ? "Select a course" 
                      : "No enrolled courses found"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {enrolledCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
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
                <div className="flex items-center gap-4">
                  <Input
                    id="certificateFile"
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload the certificate file (PDF or Image)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-base">Remarks</Label>
                <Input
                  id="remarks"
                  placeholder="Any additional notes about this certificate"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={isLoading}
                  className="h-24"
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

              <div className="flex justify-end space-x-2 pt-4">
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
      </DialogContent>
    </Dialog>
  );
}

