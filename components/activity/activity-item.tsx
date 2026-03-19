import { Clock, Award, UserPlus, BookOpen, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from '@/types/activity';
import { Button } from '../ui/button';
import Link from 'next/link';

const activityIcons = {
  CERTIFICATE_ISSUED: <Award className="h-4 w-4 text-green-500" />,
  USER_REGISTERED: <UserPlus className="h-4 w-4 text-blue-500" />,
  COURSE_CREATED: <BookOpen className="h-4 w-4 text-purple-500" />,
  USER_ENROLLED: <UserCheck className="h-4 w-4 text-amber-500" />,
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

const getActionLink = (activity: Activity) => {
  switch (activity.type) {
    case 'CERTIFICATE_ISSUED':
      return `/admin/certificates/${activity.metadata?.certificateId}`;
    case 'USER_REGISTERED':
      return `/admin/users/${activity.user.id}`;
    case 'COURSE_CREATED':
    case 'USER_ENROLLED':
      return activity.course ? `/admin/courses/${activity.course.id}` : '#';
    default:
      return '#';
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
          {activityIcons[activity.type] || <Award className="h-4 w-4 text-gray-500" />}
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
      <Button variant="ghost" size="sm" asChild>
        <Link href={getActionLink(activity)}>
          View
        </Link>
      </Button>
    </div>
  );
}
