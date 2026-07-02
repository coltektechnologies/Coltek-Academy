"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { collection, getDocs } from "firebase/firestore";
import { firebase } from "@/lib/firebase";
import { createManualEnrollment } from "@/lib/enrollment";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UserOption {
  id: string;
  email: string;
  displayName: string;
}

interface ManualEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualEnrollmentModal({ isOpen, onClose, onSuccess }: ManualEnrollmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [markCompleted, setMarkCompleted] = useState(false);

  const [openUserCombobox, setOpenUserCombobox] = useState(false);
  const [openCourseCombobox, setOpenCourseCombobox] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset state
      setSelectedUserId("");
      setSelectedCourseId("");
      setMarkCompleted(false);
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch users (only those who are students or have no role explicitly set)
      const usersSnap = await getDocs(collection(firebase.db, 'users'));
      const fetchedUsers: UserOption[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data() as any;
        const role = (data.role || '').toLowerCase();
        if (role === 'student' || role === '') {
          fetchedUsers.push({
            id: doc.id,
            email: data.email || '',
            displayName: data.displayName || '',
          });
        }
      });
      
      // Sort users
      fetchedUsers.sort((a, b) => {
        const nameA = (a.displayName || a.email || '').toLowerCase();
        const nameB = (b.displayName || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setUsers(fetchedUsers);

      // Fetch courses
      const coursesSnap = await getDocs(collection(firebase.db, 'courses'));
      const fetchedCourses: Course[] = [];
      coursesSnap.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
      });
      
      // Sort courses
      fetchedCourses.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setCourses(fetchedCourses);

    } catch (error) {
      console.error("Failed to load data for manual enrollment:", error);
      toast({
        title: "Error",
        description: "Failed to load users or courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedCourseId) {
      toast({
        title: "Validation Error",
        description: "Please select both a student and a course.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      if (!selectedUser) throw new Error("Selected user not found");

      await createManualEnrollment(
        selectedUserId,
        selectedUser.email,
        selectedCourseId,
        markCompleted
      );

      toast({
        title: "Success",
        description: `Student successfully enrolled${markCompleted ? ' and marked completed' : ''}.`,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Manual enrollment failed:", error);
      toast({
        title: "Error",
        description: "Failed to create enrollment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUserDisplay = selectedUserId 
    ? users.find(u => u.id === selectedUserId)?.displayName 
      ? `${users.find(u => u.id === selectedUserId)?.displayName} (${users.find(u => u.id === selectedUserId)?.email})`
      : users.find(u => u.id === selectedUserId)?.email
    : "Select a student...";

  const selectedCourseDisplay = selectedCourseId
    ? courses.find(c => c.id === selectedCourseId)?.title
    : "Select a course...";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manually Enroll Student</DialogTitle>
          <DialogDescription>
            Assign a course to an existing student bypassing the payment flow.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading students and courses...
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="student">Student</Label>
              <Popover open={openUserCombobox} onOpenChange={setOpenUserCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    id="student"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUserCombobox}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{selectedUserDisplay}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[550px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search students by name or email..." />
                    <CommandList>
                      <CommandEmpty>No student found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => {
                          const display = user.displayName ? `${user.displayName} (${user.email})` : user.email;
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="course">Course</Label>
              <Popover open={openCourseCombobox} onOpenChange={setOpenCourseCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    id="course"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCourseCombobox}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{selectedCourseDisplay}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[550px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search courses by title..." />
                    <CommandList>
                      <CommandEmpty>No course found.</CommandEmpty>
                      <CommandGroup>
                        {courses.map((course) => (
                          <CommandItem
                            key={course.id}
                            value={course.title}
                            onSelect={() => {
                              setSelectedCourseId(course.id);
                              setOpenCourseCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCourseId === course.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {course.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2 mt-2 bg-muted/30 p-4 rounded-md border border-border">
              <Checkbox 
                id="mark-completed" 
                checked={markCompleted} 
                onCheckedChange={(checked) => setMarkCompleted(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="mark-completed" className="text-sm font-medium cursor-pointer">
                  Mark course as completed immediately
                </Label>
                <p className="text-sm text-muted-foreground">
                  This will allow you to instantly issue a certificate for this course.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting || loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading || !selectedUserId || !selectedCourseId}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enroll Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
