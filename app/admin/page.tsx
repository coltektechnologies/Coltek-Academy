"use client"

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Lazy load components
const AdminLayout = dynamic<{ children: React.ReactNode }>(
  () => import('@/components/admin/AdminLayout').then(mod => mod.AdminLayout), 
  { 
    ssr: false,
    loading: () => <LoadingFallback />
  }
);

const AdminHeader = dynamic<{
  title: string;
  description?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  className?: string;
}>(() => import('@/components/admin/AdminHeader').then(mod => mod.AdminHeader), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

const IssueCertificate = dynamic<{
  users: Array<{
    id: string;
    email: string;
    displayName: string;  // Made displayName required to match the User interface
    role?: string;
    photoURL?: string;
    enrolledCourses?: string[];
  }>;
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    level?: string;
    enrolledStudents?: string[];
  }>;
  children?: React.ReactNode;
}>(() => import('@/components/admin/issue-certificate').then(mod => mod.IssueCertificate), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

const ActivityItem = dynamic<{ activity: Activity }>(() => import('@/components/activity/activity-item').then(mod => mod.ActivityItem), { 
  ssr: false,
  loading: () => <LoadingFallback />
});

// Lazy load UI components
const Card = dynamic<React.ComponentProps<typeof import('@/components/ui/card').Card>>(
  () => import('@/components/ui/card').then(mod => mod.Card), 
  { ssr: false }
);

const CardContent = dynamic<React.ComponentProps<typeof import('@/components/ui/card').CardContent>>(
  () => import('@/components/ui/card').then(mod => mod.CardContent), 
  { ssr: false }
);

const CardDescription = dynamic<React.ComponentProps<typeof import('@/components/ui/card').CardDescription>>(
  () => import('@/components/ui/card').then(mod => mod.CardDescription), 
  { ssr: false }
);

const CardHeader = dynamic<React.ComponentProps<typeof import('@/components/ui/card').CardHeader>>(
  () => import('@/components/ui/card').then(mod => mod.CardHeader), 
  { ssr: false }
);

const CardTitle = dynamic<React.ComponentProps<typeof import('@/components/ui/card').CardTitle>>(
  () => import('@/components/ui/card').then(mod => mod.CardTitle), 
  { ssr: false }
);

const Button = dynamic<React.ComponentProps<typeof import('@/components/ui/button').Button>>(
  () => import('@/components/ui/button').then(mod => mod.Button), 
  { ssr: false }
);

// Lazy load icons
const Users = dynamic(
  () => import('lucide-react').then(mod => mod.Users), 
  { ssr: false, loading: () => <span className="w-6 h-6" /> }
);

const BookOpen = dynamic(
  () => import('lucide-react').then(mod => mod.BookOpen), 
  { ssr: false, loading: () => <span className="w-6 h-6" /> }
);

const FileText = dynamic(
  () => import('lucide-react').then(mod => mod.FileText), 
  { ssr: false, loading: () => <span className="w-6 h-6" /> }
);
const BarChart2 = dynamic(
  () => import('lucide-react').then(mod => mod.BarChart2), 
  { ssr: false, loading: () => <span className="w-6 h-6" /> }
);

const Upload = dynamic(
  () => import('lucide-react').then(mod => mod.Upload), 
  { ssr: false, loading: () => <span className="w-6 h-6" /> }
);

const Award = dynamic(
  () => import('lucide-react').then(mod => mod.Award), 
  { ssr: false, loading: () => <span className="w-6 h-6" /> }
);

const Clock = dynamic(
  () => import('lucide-react').then(mod => mod.Clock), 
  { ssr: false, loading: () => <span className="w-6 h-6" /> }
);

import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getCountFromServer, 
  getDocs, 
  onSnapshot, 
  DocumentData, 
  DocumentSnapshot, 
  QuerySnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Activity } from '@/types/activity';
import { subscribeToActivities, getRecentActivities } from '@/lib/activity-service';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  photoURL?: string;
}

interface Certificate {
  userId: string;
  certificateId: string;
  issueDate: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  students?: number;
  duration?: string;
  level?: string;
  enrolledStudents?: string[];
  issuedCertificates?: Certificate[];
}

export default function AdminPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    certificatesIssued: 0,
    activeStudents: 0,
    activeUsers: 0
  });
  const [activeTab, setActiveTab] = useState('certificates');
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user from auth context
  const { user: currentUser, loading: authLoading } = useAuth();

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        if (!authLoading) {
          // If not authenticated and auth is done loading, redirect to login
          router.push('/auth/signin');
        }
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data()?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setError('You do not have permission to access this page');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Error verifying permissions. Please try again later.');
        setIsLoading(false);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, authLoading, router]);

  // Fetch activities
  useEffect(() => {
    // Only fetch activities if user is admin
    if (!isAdmin) {
      return;
    }

    setIsLoading(true);

    // Initial load of activities
    const loadActivities = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const recentActivities = await getRecentActivities(10);
        setActivities(recentActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
        setError('Failed to load activities. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();

    // Set up real-time subscription
    let unsubscribe: (() => void) | null = null;
    try {
      const q = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const newActivities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Activity[];
          setActivities(newActivities);
          setError(null);
        },
        (error) => {
          console.error('Error in real-time subscription:', error);
          if (error.code === 'permission-denied') {
            setError('You do not have permission to view activities. Please contact an administrator.');
          } else {
            setError('Real-time updates are not available. Page will refresh to show new activities.');
          }
        }
      );
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
      setError('Failed to set up real-time updates. Page will refresh to show new activities.');
    }

      // Clean up subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAdmin]); // Only re-run if admin status changes

  const filterUsers = useCallback((query: string, usersList: UserData[]) => {
    if (!query.trim()) return usersList;
    const lowerQuery = query.toLowerCase();
    return usersList.filter(user => 
      user.displayName?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery) ||
      user.role?.toLowerCase().includes(lowerQuery)
    );
  }, []);

  const filterCourses = useCallback((query: string, coursesList: Course[]) => {
    if (!query.trim()) return coursesList;
    const lowerQuery = query.toLowerCase();
    return coursesList.filter(course => 
      course.title?.toLowerCase().includes(lowerQuery) ||
      course.description?.toLowerCase().includes(lowerQuery) ||
      course.level?.toLowerCase().includes(lowerQuery)
    );
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setFilteredUsers(filterUsers(query, users));
    setFilteredCourses(filterCourses(query, courses));
  };

  const handleSearchSubmit = (query: string) => {
    // We're already filtering on change, but you could add additional logic here
    console.log('Search submitted:', query);
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersData = usersSnapshot.docs.map(docItem => ({
        id: docItem.id,
        email: docItem.data().email || '',
        displayName: docItem.data().displayName || '',
        role: docItem.data().role || 'student',
        photoURL: docItem.data().photoURL || '',
        enrolledCourses: docItem.data().enrolledCourses || []
      })) as UserData[];
      
      setUsers(usersData);
      setFilteredUsers(usersData); // Initialize filtered users with all users
      
      // Filter for students (role is 'student' or not set)
      const students = usersData.filter(user => !user.role || user.role === 'student');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeUsers: students.length
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  };

  // Fetch courses with detailed debugging
  const fetchCourses = async () => {
    try {
      console.log('1. Starting to fetch courses...');
      const coursesRef = collection(db, 'courses');
      console.log('2. Collection reference created:', coursesRef);
      
      // First, try to get the documents directly
      console.log('3. Attempting to get documents...');
      const coursesSnapshot = await getDocs(coursesRef);
      
      // Log collection metadata
      console.log('4. Collection metadata:', {
        path: coursesRef.path,
        id: coursesRef.id,
        type: coursesRef.type
      });
      
      // Log snapshot details
      console.log('5. Snapshot details:', {
        size: coursesSnapshot.size,
        empty: coursesSnapshot.empty,
        fromCache: coursesSnapshot.metadata.fromCache,
        hasPendingWrites: coursesSnapshot.metadata.hasPendingWrites
      });
      
      // Log each document in the collection
      const coursesData: Course[] = [];
      console.log('6. Documents in collection:');
      coursesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  - ${doc.id}:`, data);
        coursesData.push({
          id: doc.id,
          title: data.title || 'Untitled Course',
          description: data.description,
          duration: data.duration,
          level: data.level,
          enrolledStudents: data.enrolledStudents || []
        });
      });
      
      console.log('7. Processed courses data:', coursesData);
      setCourses(coursesData);
      setFilteredCourses(coursesData); // Initialize filtered courses with all courses
      
      // Set up a real-time listener for changes
      const unsubscribe = onSnapshot(coursesRef, 
        (snapshot) => {
          console.log('Live update - Courses changed. New count:', snapshot.size);
          const updatedCourses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Course[];
          setCourses(updatedCourses);
          setFilteredCourses(updatedCourses);
        },
        (error) => {
          console.error('Error in courses listener:', error);
        }
      );
      
      // Return the unsubscribe function to clean up the listener
      return () => unsubscribe();
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalCourses: coursesData.length,
        certificatesIssued: coursesData.reduce((acc, course) => 
          acc + (course.issuedCertificates?.length || 0), 0)
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    }
  };

  // Check admin status on mount and when user/auth changes
  useEffect(() => {
    const initializeAdminPage = async () => {
      if (authLoading) return;

      // Redirect to login if not authenticated
      if (!currentUser) {
        router.push('/admin/login');
        return;
      }

      try {
        // Check admin status in both users and adminUsers collections
        const [userDoc, adminDoc] = await Promise.all([
          getDoc(doc(db, 'users', currentUser.uid)),
          getDoc(doc(db, 'adminUsers', currentUser.uid))
        ]);

        const isUserAdmin = adminDoc.exists() && adminDoc.data()?.role === 'admin';
        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          toast({
            title: 'Access Denied',
            description: 'You do not have admin privileges',
            variant: 'destructive',
          });
          router.push('/');
          return;
        }

        // Fetch data if user is admin
        await Promise.all([fetchUsers(), fetchCourses()]);
        
        // Update admin status in UI
        setAdminLoading(false);
      } catch (error) {
        console.error('Error initializing admin page:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize admin dashboard',
          variant: 'destructive',
        });
        router.push('/admin/login');
      } finally {
        setAdminLoading(false);
      }
    };

    initializeAdminPage();
  }, [currentUser, authLoading, router, toast]);

  // Fetch statistics function
  const fetchStats = useCallback(async () => {
    if (!isAdmin || authLoading || adminLoading) return;

    try {
      // Fetch total students (users with role 'student')
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const usersSnapshot = await getCountFromServer(usersQuery);
      const totalStudents = usersSnapshot.data().count;

      // Fetch courses from Firestore
      const coursesQuery = collection(db, 'courses');
      const coursesSnapshot = await getCountFromServer(coursesQuery);
      const totalCourses = coursesSnapshot.data().count;

      // Fetch total certificates issued
      const certsQuery = collection(db, 'certificates');
      const certsSnapshot = await getCountFromServer(certsQuery);
      const totalCertificates = certsSnapshot.data().count;

      // Calculate active users (users who logged in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastLogin', '>=', thirtyDaysAgo)
      );
      const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
      const activeUsers = activeUsersSnapshot.data().count;

      setStats({
        totalUsers: totalStudents,
        totalCourses: totalCourses,
        certificatesIssued: totalCertificates,
        activeStudents: activeUsers,
        activeUsers: activeUsers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        variant: 'destructive',
      });
    }
  }, [isAdmin, authLoading, adminLoading, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (authLoading || adminLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-6 max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title="Admin Dashboard" 
        description="Welcome to the admin dashboard"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        placeholder="Search users, courses, and more..."
      />
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 30) + 5}% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 5)} from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.certificatesIssued}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 10) + 1} from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Issue Certificate
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Add New User
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="md:col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
                  <p className="text-sm text-muted-foreground">
                    Latest actions in the system
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <IssueCertificate users={users} courses={courses}>
                    <Button size="sm">
                      <Award className="mr-2 h-4 w-4" />
                      Issue Certificate
                    </Button>
                  </IssueCertificate>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : !isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No activities found</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
            <CardDescription>
              {users.length} students registered in total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.displayName || 'New User'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {user.role || 'Student'}
                  </span>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}