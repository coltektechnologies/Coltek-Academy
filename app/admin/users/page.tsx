"use client";

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getUserEnrollments } from '@/lib/enrollment';
import type { UserEnrollment } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, BookOpen, Calendar, CreditCard, Plus, Pencil, Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  photoURL?: string;
}

const ROLES = ['student', 'admin', 'instructor'] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [createForm, setCreateForm] = useState({ displayName: '', email: '', role: 'student' as const });
  const [editForm, setEditForm] = useState({ displayName: '', email: '', role: 'student' as const });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        email: docSnap.data().email || '',
        displayName: docSnap.data().displayName || '',
        role: docSnap.data().role || 'student',
        photoURL: docSnap.data().photoURL || '',
      }));
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.displayName.trim() || !createForm.email.trim()) {
      toast({ title: 'Validation error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const newId = crypto.randomUUID();
      const userRef = doc(db, 'users', newId);
      await setDoc(userRef, {
        uid: newId,
        displayName: createForm.displayName.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'User created', description: `${createForm.displayName} has been added.` });
      setCreateOpen(false);
      setCreateForm({ displayName: '', email: '', role: 'student' });
      setLoading(true);
      await fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create user.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser || !editForm.displayName.trim() || !editForm.email.trim()) return;
    setSubmitting(true);
    try {
      const userRef = doc(db, 'users', editUser.id);
      await updateDoc(userRef, {
        displayName: editForm.displayName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'User updated', description: `${editForm.displayName} has been saved.` });
      setEditUser(null);
      setLoading(true);
      await fetchUsers();
      if (selectedUser?.id === editUser.id) {
        setSelectedUser({ ...editUser, ...editForm });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update user.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      const userRef = doc(db, 'users', deleteUser.id);
      await deleteDoc(userRef);
      toast({ title: 'User deleted', description: `${deleteUser.displayName || deleteUser.email} has been removed.` });
      setDeleteUser(null);
      if (selectedUser?.id === deleteUser.id) setSelectedUser(null);
      setLoading(true);
      await fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user: UserData) => {
    setEditUser(user);
    setEditForm({ displayName: user.displayName || '', email: user.email || '', role: (user.role || 'student') as typeof editForm.role });
  };

  const handleUserClick = useCallback(async (user: UserData) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    setEnrollments([]);
    try {
      const list = await getUserEnrollments(user.id);
      const byCourse = new Map<string, UserEnrollment>();
      for (const e of list) {
        const existing = byCourse.get(e.courseId);
        const date = e.enrollmentDate instanceof Date ? e.enrollmentDate.getTime() : new Date(e.enrollmentDate as string).getTime();
        const existingDate = existing
          ? (existing.enrollmentDate instanceof Date ? existing.enrollmentDate.getTime() : new Date(existing.enrollmentDate as string).getTime())
          : 0;
        if (!existing || date > existingDate) byCourse.set(e.courseId, e);
      }
      setEnrollments(Array.from(byCourse.values()));
    } catch (err) {
      setEnrollments([]);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return <AdminLayout><div className="p-6">Loading users...</div></AdminLayout>;
  }

  if (error) {
    return <AdminLayout><div className="p-6 text-red-600">{error}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground text-sm mt-1">Click a row to view details. Use Edit and Delete in the detail panel.</p>
          </div>
          <Button onClick={() => { setCreateOpen(true); setCreateForm({ displayName: '', email: '', role: 'student' }); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {users.map(user => (
                <tr
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                    {user.displayName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary">{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(user)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteUser(user)} title="Delete" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="h-16 w-16 shrink-0">
                      <AvatarImage src={selectedUser.photoURL} alt={selectedUser.displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {(selectedUser.displayName || selectedUser.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <SheetTitle className="text-xl">{selectedUser.displayName || 'Student'}</SheetTitle>
                      <SheetDescription>{selectedUser.email}</SheetDescription>
                      <Badge variant="secondary" className="mt-2">{selectedUser.role}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); openEdit(selectedUser); }}
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteUser(selectedUser); }}
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>
              <div className="py-6 space-y-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {enrollments.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Enrolled courses ({enrollments.length})
                        </h4>
                        <div className="space-y-3">
                          {enrollments.map((e) => (
                            <div
                              key={e.id}
                              className="rounded-lg border border-border bg-muted/30 p-4"
                            >
                              <p className="font-medium text-foreground">{e.courseTitle}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {e.enrollmentDate instanceof Date
                                    ? e.enrollmentDate.toLocaleDateString()
                                    : new Date(e.enrollmentDate as string).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  {e.paymentMethod} • GH₵{e.paymentAmount}
                                </span>
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs">{e.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {enrollments.length === 0 && !loadingDetails && (
                      <p className="text-sm text-muted-foreground">No enrollments yet.</p>
                    )}
                    {enrollments.length > 0 && enrollments[0]?.personalInfo && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Registration info
                        </h4>
                        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {enrollments[0].personalInfo.firstName} {enrollments[0].personalInfo.lastName}</p>
                          <p><span className="text-muted-foreground">Email:</span> {enrollments[0].personalInfo.email}</p>
                          {enrollments[0].personalInfo.phone && (
                            <p><span className="text-muted-foreground">Phone:</span> {enrollments[0].personalInfo.phone}</p>
                          )}
                          {enrollments[0].education?.highestEducation && (
                            <p><span className="text-muted-foreground">Education:</span> {enrollments[0].education.highestEducation}</p>
                          )}
                          {enrollments[0].education?.fieldOfStudy && (
                            <p><span className="text-muted-foreground">Field:</span> {enrollments[0].education.fieldOfStudy}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user in Firestore. They must sign up via the app to get Firebase Auth login.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Display Name</Label>
              <Input
                id="create-name"
                value={createForm.displayName}
                onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as typeof createForm.role }))}>
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details. Changes are saved to Firestore.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as typeof editForm.role }))}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.displayName || deleteUser?.email}</strong>? This removes their Firestore document. Their Firebase Auth account (if any) will remain until removed separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
