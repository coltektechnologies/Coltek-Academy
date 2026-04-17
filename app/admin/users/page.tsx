"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { firebase } from '@/lib/firebase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getUserEnrollments } from '@/lib/enrollment';
import type { UserEnrollment } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import type { AuthUserRow } from '@/lib/types';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, User, BookOpen, Calendar, CreditCard, Plus, Pencil, Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  photoURL?: string;
}

const ROLES = ['student', 'admin', 'instructor'] as const;

function providerLabel(id: string): string {
  if (id === 'password') return 'Email';
  if (id === 'google.com') return 'Google';
  if (id === 'github.com') return 'GitHub';
  return id.replace('.com', '');
}

export default function UsersPage() {
  const { user: sessionUser, loading: sessionLoading } = useAuth();
  const [firestoreProfiles, setFirestoreProfiles] = useState<UserData[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUserRow[]>([]);
  const [authListError, setAuthListError] = useState<string | null>(null);
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

  const profileByUid = useMemo(() => {
    const m = new Map<string, UserData>();
    for (const p of firestoreProfiles) m.set(p.id, p);
    return m;
  }, [firestoreProfiles]);

  const authUidSet = useMemo(() => new Set(authUsers.map((u) => u.uid)), [authUsers]);

  const firestoreOnlyProfiles = useMemo(
    () => firestoreProfiles.filter((p) => !authUidSet.has(p.id)),
    [firestoreProfiles, authUidSet]
  );

  const loadData = useCallback(async () => {
    if (!sessionUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setAuthListError(null);
    try {
      const usersRef = collection(firebase.db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const profiles: UserData[] = usersSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        email: docSnap.data().email || '',
        displayName: docSnap.data().displayName || '',
        role: docSnap.data().role || 'student',
        photoURL: docSnap.data().photoURL || '',
      }));
      setFirestoreProfiles(profiles);

      const token = await sessionUser.getIdToken(true);
      const res = await fetch('/api/admin/auth-users', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthUsers([]);
        setAuthListError(
          [body.error, body.detail].filter(Boolean).join(' — ') ||
            `Could not load Auth users (${res.status}).`
        );
        return;
      }
      setAuthUsers(Array.isArray(body.users) ? body.users : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    if (sessionLoading) return;
    void loadData();
  }, [sessionLoading, loadData]);

  const mergedForEdit = useCallback(
    (auth: AuthUserRow): UserData => {
      const p = profileByUid.get(auth.uid);
      return {
        id: auth.uid,
        email: p?.email || auth.email || '',
        displayName: p?.displayName || auth.displayName || '',
        role: (p?.role || 'student') as UserData['role'],
        photoURL: p?.photoURL || auth.photoURL || '',
      };
    },
    [profileByUid]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.displayName.trim() || !createForm.email.trim()) {
      toast({ title: 'Validation error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const newId = crypto.randomUUID();
      const userRef = doc(firebase.db, 'users', newId);
      await setDoc(userRef, {
        uid: newId,
        displayName: createForm.displayName.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'User created', description: `${createForm.displayName} has been added (Firestore only — no Auth login).` });
      setCreateOpen(false);
      setCreateForm({ displayName: '', email: '', role: 'student' });
      await loadData();
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
      const userRef = doc(firebase.db, 'users', editUser.id);
      await setDoc(
        userRef,
        {
          uid: editUser.id,
          displayName: editForm.displayName.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          photoURL: editUser.photoURL || '',
          updatedAt: new Date().toISOString(),
          ...(profileByUid.has(editUser.id) ? {} : { createdAt: new Date().toISOString() }),
        },
        { merge: true }
      );
      toast({
        title: profileByUid.has(editUser.id) ? 'User updated' : 'Firestore profile created',
        description: `${editForm.displayName} saved under users/${editUser.id}.`,
      });
      setEditUser(null);
      await loadData();
      if (selectedUser?.id === editUser.id) {
        setSelectedUser({
          ...editUser,
          displayName: editForm.displayName.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save user.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      const userRef = doc(firebase.db, 'users', deleteUser.id);
      await deleteDoc(userRef);
      toast({ title: 'User deleted', description: `${deleteUser.displayName || deleteUser.email} removed from Firestore.` });
      setDeleteUser(null);
      if (selectedUser?.id === deleteUser.id) setSelectedUser(null);
      await loadData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user: UserData) => {
    setEditUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email || '',
      role: (user.role || 'student') as typeof editForm.role,
    });
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

  if (sessionLoading || loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading users…
        </div>
      </AdminLayout>
    );
  }

  if (!sessionUser) {
    return (
      <AdminLayout>
        <div className="p-6 text-muted-foreground">
          Sign in with Firebase (e.g. main site or admin login) to view users.
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 text-red-600">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Firebase Authentication accounts. Firestore column shows app profile at <code className="text-xs bg-muted px-1 rounded">users/{"{uid}"}</code>.
            </p>
          </div>
          <Button
            onClick={() => {
              setCreateOpen(true);
              setCreateForm({ displayName: '', email: '', role: 'student' });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Firestore-only row
          </Button>
        </div>

        {authListError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Auth user list unavailable</AlertTitle>
            <AlertDescription>{authListError}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto rounded-lg border border-border mb-10">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sign-in</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Firestore</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last sign-in</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {authUsers.length === 0 && !authListError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No Firebase Authentication users found.
                  </td>
                </tr>
              ) : authUsers.length === 0 && authListError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Fix the configuration above to load Auth users. Firestore-only rows are listed below.
                  </td>
                </tr>
              ) : (
                authUsers.map((a) => {
                  const profile = profileByUid.get(a.uid);
                  const rowUser = mergedForEdit(a);
                  const hasProfile = !!profile;
                  return (
                    <tr
                      key={a.uid}
                      onClick={() => handleUserClick(rowUser)}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {rowUser.displayName || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{a.email || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.providers.length ? a.providers.map(providerLabel).join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {hasProfile ? (
                          <Badge variant="default" className="text-xs">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">No</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{profile?.role || '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {a.creationTime ? new Date(a.creationTime).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {a.lastSignInTime ? new Date(a.lastSignInTime).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(rowUser)} title="Edit / create Firestore profile">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => hasProfile && setDeleteUser(rowUser)}
                            title={hasProfile ? 'Delete Firestore profile' : 'No Firestore doc to delete'}
                            disabled={!hasProfile}
                            className={!hasProfile ? 'opacity-40' : 'text-destructive hover:text-destructive'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {firestoreOnlyProfiles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Firestore only (no Auth account)</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Manual rows or legacy IDs that do not match a Firebase Auth UID.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Doc ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {firestoreOnlyProfiles.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">{user.displayName || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.id}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteUser(user)} className="text-destructive">
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
        )}
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
                      <SheetTitle className="text-xl">{selectedUser.displayName || 'User'}</SheetTitle>
                      <SheetDescription>{selectedUser.email}</SheetDescription>
                      <p className="text-xs text-muted-foreground mt-1 font-mono break-all">UID: {selectedUser.id}</p>
                      <Badge variant="secondary" className="mt-2">{selectedUser.role}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(selectedUser); }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (profileByUid.has(selectedUser.id)) setDeleteUser(selectedUser);
                      }}
                      disabled={!profileByUid.has(selectedUser.id)}
                      title="Delete Firestore profile"
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
                            <div key={e.id} className="rounded-lg border border-border bg-muted/30 p-4">
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Firestore-only row</DialogTitle>
            <DialogDescription>
              Creates <code className="text-xs">users/{"{random-id}"}</code> with no Firebase login. To manage real members, use Auth users above and Edit to create <code className="text-xs">users/{"{uid}"}</code>.
            </DialogDescription>
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

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Firestore profile</DialogTitle>
            <DialogDescription>
              Saves to <code className="text-xs">users/{editUser?.id}</code>. Use this to add a missing profile for an Auth user or update role/name.
            </DialogDescription>
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

      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Firestore profile</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteUser?.displayName || deleteUser?.email}</strong> from Firestore only. Their Firebase Authentication account (if any) is unchanged.
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
