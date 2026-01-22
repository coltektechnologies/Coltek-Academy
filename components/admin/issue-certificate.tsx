'use client';

import { useState, useEffect } from 'react';
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
import { toast } from '@/components/ui/use-toast';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

interface IssueCertificateProps {
  users: User[];
  courses: Course[];
  children?: React.ReactNode;
}

export function IssueCertificate({ users, courses, children }: IssueCertificateProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  
  // Filter users to only show students (must have role 'student')
  const students = users.filter(user => user.role === 'student');
  
  // Debug effect (commented out but kept for future use)
  // useEffect(() => {
  //   console.log('All users:', users);
  //   console.log('Filtered students:', students);
  // }, [users, students]);

  // Update enrolled courses when user changes
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      if (user?.enrolledCourses?.length) {
        const userCourses = courses.filter(course => 
          user.enrolledCourses?.includes(course.id)
        );
        setEnrolledCourses(userCourses);
      } else {
        setEnrolledCourses([]);
      }
    } else {
      setEnrolledCourses([]);
      setSelectedCourseId('');
    }
  }, [selectedUserId, users, courses]);

  const handleFileUpload = async (file: File): Promise<string> => {
    if (!file) return '';
    
    const storageRef = ref(storage, `certificates/${selectedUserId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
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
      setIsLoading(true);
      
      // Upload certificate file
      const fileUrl = await handleFileUpload(certificateFile);
      
      const certId = certificateId || `cert_${Date.now()}`;
      const issueDate = new Date().toISOString();
      
      // Update user's certificates
      const userRef = doc(db, 'users', selectedUserId);
      await updateDoc(userRef, {
        certificates: arrayUnion({
          id: certId,
          courseId: selectedCourseId,
          issueDate,
          status: 'issued',
          fileUrl,
          remarks,
          verified: true
        })
      });

      // Update course's issued certificates
      const courseRef = doc(db, 'courses', selectedCourseId);
      await updateDoc(courseRef, {
        issuedCertificates: arrayUnion({
          userId: selectedUserId,
          certificateId: certId,
          issueDate,
          remarks,
          fileUrl
        })
      });

      toast({
        title: 'Success',
        description: 'Certificate issued successfully',
      });
      
      setIsOpen(false);
      // Reset form
      setSelectedUserId('');
      setSelectedCourseId('');
      setCertificateId('');
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
                  {students.length > 0 ? (
                    students.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName || user.email || `User ${user.id}`}
                      </SelectItem>
                    ))
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

