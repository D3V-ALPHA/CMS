import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface CourseModalProps {
  course: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProgressUpdate: () => void;
}

export function CourseModal({ course, open, onOpenChange, onProgressUpdate }: CourseModalProps) {
  const queryClient = useQueryClient();

  // Fetch lessons for this specific course
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["course-lessons", course?.id],
    queryFn: () => api.get(`/courses/${course?.id}/lessons`).then(res => res.data),
    enabled: !!course?.id && open,
  });

  // ✅ Always pass courseId so backend returns a single progress object, not an array
  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ["course-progress", course?.id],
    queryFn: () =>
      api.get(`/students/me/progress?courseId=${course?.id}`).then(res => res.data),
    enabled: !!course?.id && open,
  });

  // Fetch completed lesson IDs separately so we know which lessons to mark
  const { data: completedData, refetch: refetchCompleted } = useQuery({
    queryKey: ["completed-lessons", course?.id],
    queryFn: () =>
      api.get(`/students/me/completed-lessons?courseId=${course?.id}`).then(res => res.data),
    enabled: !!course?.id && open,
  });

  const completeLessonMutation = useMutation({
    mutationFn: (lessonId: string) => api.patch(`/lessons/${lessonId}/complete`),
    onSuccess: () => {
      // Invalidate all related queries so progress recalculates from backend
      queryClient.invalidateQueries({ queryKey: ["course-progress", course?.id] });
      queryClient.invalidateQueries({ queryKey: ["completed-lessons", course?.id] });
      queryClient.invalidateQueries({ queryKey: ["student-progress"] });
      refetchProgress();
      refetchCompleted();
      onProgressUpdate();
      toast.success("Lesson completed!");
    },
  });

  if (!course) return null;

  // ✅ Use backend-calculated percentage directly — backend knows total lessons including new ones
  const percentage = progress?.completionPercentage ?? 0;

  // ✅ completedLessonIds comes from a dedicated endpoint, not the progress summary
  const completedLessonIds: string[] = completedData?.completedLessonIds ?? [];

  const totalLessons = lessons?.length ?? 0;
  const completedCount = progress?.completedCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Progress bar — always driven by backend calculation */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{completedCount} / {totalLessons} lessons &nbsp;·&nbsp; {Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {lessonsLoading ? (
            <div>Loading lessons...</div>
          ) : totalLessons === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No lessons added to this course yet.
            </p>
          ) : (
            <div className="space-y-3">
              {lessons?.map((lesson: any) => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                return (
                  <Card key={lesson.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-grow mr-4">
                        <h3 className="font-medium">{lesson.title}</h3>
                        {lesson.content && (
                          <p className="text-sm text-muted-foreground mt-1">{lesson.content}</p>
                        )}
                      </div>
                      <Button
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => !isCompleted && completeLessonMutation.mutate(lesson.id)}
                        disabled={isCompleted || completeLessonMutation.isPending}
                        className="flex-shrink-0"
                      >
                        {isCompleted
                          ? <><CheckCircle className="mr-2 h-4 w-4" />Completed</>
                          : <><Circle className="mr-2 h-4 w-4" />Mark Complete</>
                        }
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}