"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, FileText, BarChart2, Upload, Award } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { IssueCertificate } from '@/components/admin/issue-certificate'

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
  issuedCertificates?: Certificate[];
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    certificatesIssued: 0,
    activeStudents: 0,
    activeUsers: 0 // Added to fix the calculation in the template
  })
  const [activeTab, setActiveTab] = useState('certificates')
  const [users, setUsers] = useState<UserData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]); // Added courses state

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
      
      // Filter for students (role is 'student' or not set)
      const students = usersData.filter(user => !user.role || user.role === 'student');
      
      setUsers(usersData);
      
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

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      })) as Course[];
      setCourses(coursesData);
      
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
    if (isAdmin) {
      fetchUsers();
      fetchCourses();
    }
    const checkAdminStatus = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/admin/login')
        return
      }

      try {
        // Check if user is an admin in Firestore
        const adminDoc = await getDoc(doc(db, 'adminUsers', user.uid))
        const isUserAdmin = adminDoc.exists() && adminDoc.data()?.role === 'admin'

        if (!isUserAdmin) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          })
          router.push('/admin/login')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/admin/login')
      } finally {
        setAdminLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, authLoading, router, toast])

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

      // For now, we'll count all students as active
      // In a production app, you should track and query lastActive timestamps
      const activeStudents = totalStudents;

      setStats({
        totalUsers: totalStudents,
        totalCourses: totalCourses,
        certificatesIssued: totalCertificates,
        activeStudents: activeStudents,
        activeUsers: activeStudents // Assuming active users are the same as active students for now
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null // Will redirect
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title="Dashboard Overview"
        description="Welcome back! Here's what's happening with your academy today."
      />
      
      <main className="p-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(stats.totalUsers * 0.12).toLocaleString()} from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(stats.totalCourses * 0.25)} from last quarter
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.certificatesIssued.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(stats.certificatesIssued * 0.18).toLocaleString()} this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                {Math.floor((stats.activeStudents / stats.totalUsers) * 100)}% of total users
              </p>
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
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                <IssueCertificate users={users} courses={courses}>
                  <Button>
                    <Award className="mr-2 h-4 w-4" />
                    Issue Certificate
                  </Button>
                </IssueCertificate>
                <Button variant="outline">
                  View
                </Button>
              </div>
              </div>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      New certificate issued to John Doe
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Web Development Bootcamp - {item} hour{item !== 1 ? 's' : ''} ago
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))}
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
      </main>
    </AdminLayout>
  )
}