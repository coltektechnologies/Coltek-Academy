import { Clock, Award, UserPlus, BookOpen, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from '@/types/activity';
import { Button } from '../ui/button';
import Link from 'next/link';

const activityIcons = {
  CERTIFICATE_ISSUED: <Award className="h-4 w-4 text-success" />,
  USER_REGISTERED: <UserPlus className="h-4 w-4 text-info" />,
  COURSE_CREATED: <BookOpen className="h-4 w-4 text-accent" />,
  USER_ENROLLED: <UserCheck className="h-4 w-4 text-warning" />,
};

const activityMessages = {
  CERTIFICATE_ISSUED: (user: string, course?: string) => 
    `Certificate issued to ${user} for ${course || 'a course'}`,
  USER_REGISTERED: (user: string) => 
    `New user registered: ${user}`,
  COURSE_CREATED: (user: string, course?: string) => 
    `${user} created a new course: ${course || 'Untitled'}`,
  USER_ENROLLED: (user: string, course?: string) => 
    `${user} enrolled in ${course || 'a course'}`,
};

// Only link to admin pages that exist (there are no per-user or per-course admin pages)
const getActionLink = (activity: Activity): string | null => {
  switch (activity.type) {
    case 'CERTIFICATE_ISSUED':
      return activity.metadata?.certificateId ? `/admin/certificates/${activity.metadata.certificateId}` : '/admin/certificates';
    case 'USER_REGISTERED':
      return '/admin/users';
    case 'COURSE_CREATED':
    case 'USER_ENROLLED':
      return '/admin/courses';
    default:
      return null;
  }
};

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const timestamp = activity.timestamp?.toDate ? 
    activity.timestamp.toDate() : 
    new Date(activity.timestamp as unknown as string);

  return (
    <div className="flex items-start justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-start space-x-3">
        <div className="mt-0.5">
          {activityIcons[activity.type] || <Award className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {activityMessages[activity.type](
              activity.user.name || 'a user',
              activity.course?.title
            )}
          </p>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </div>
        </div>
      </div>
      {getActionLink(activity) && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={getActionLink(activity)!}>
            View
          </Link>
        </Button>
      )}
    </div>
  );
}
