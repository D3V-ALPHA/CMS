/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier } from "dnd-core";
import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Plus, GripVertical, Users, BookOpen, Activity, UserPlus, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useTeacherDashboard, useCourseLessons, useCreateCourse, useAddLesson, useReorderLessons } from "@/hooks/useTeacherCourses";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useAuthStore } from "@/stores/authStore";
import { AddLessonDialog } from "@/components/AddLessonDialog";

// Drag-and-drop lesson item component
interface DraggableLessonProps {
  lesson: any;
  index: number;
  courseId: string;
  moveLesson: (courseId: string, dragIndex: number, hoverIndex: number) => void;
}

const DraggableLesson = ({ lesson, index, courseId, moveLesson }: DraggableLessonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop<{ index: number; courseId: string }, void, { handlerId: Identifier | null }>({
    accept: "lesson",
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(item: { index: number; courseId: string }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragCourseId = item.courseId;
      if (dragCourseId !== courseId) return;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = (clientOffset.y - hoverBoundingRect.top);
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveLesson(courseId, dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: "lesson",
    item: () => ({ id: lesson.id, index, courseId }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  return (
    <motion.div
      ref={ref}
      layout
      data-handler-id={handlerId}
      className={`flex items-center gap-3 p-3 bg-accent/50 rounded-lg border border-border hover:bg-accent hover:shadow-md transition-all cursor-move ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">{lesson.title}</p>
        <p className="text-xs text-muted-foreground">{lesson.content?.substring(0, 60) || "No content"}</p>
      </div>
    </motion.div>
  );
};

export function TeacherDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [localCourses, setLocalCourses] = useState<any[]>([]);

  // Real API hooks
  const { data: courses, isLoading: coursesLoading, refetch: refetchCourses } = useTeacherDashboard();
  const { data: lessons, isLoading: lessonsLoading, refetch: refetchLessons } = useCourseLessons(selectedCourseId!);
  const createCourseMutation = useCreateCourse();
  const addLessonMutation = useAddLesson(selectedCourseId!);
  const reorderMutation = useReorderLessons(selectedCourseId!);
  const activities = useActivityFeed();

  // Sync courses from API (safe: only updates when courses change)
  useEffect(() => {
    if (courses) setLocalCourses(courses);
  }, [courses]);

  // Ensure teacher is logged in
  useEffect(() => {
    if (user && user.role !== "teacher") navigate("/");
  }, [user, navigate]);
  useEffect(() => { document.title = "Teacher Portal — CMS"; }, []);

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) {
      toast.error("Course title is required");
      return;
    }
    await createCourseMutation.mutateAsync({ title: newCourseTitle, description: newCourseDesc });
    setIsCreateDialogOpen(false);
    setNewCourseTitle("");
    setNewCourseDesc("");
    refetchCourses();
    toast.success("Course created!");
  };

  const handleAddLesson = async (data: { title: string; content?: string; order: number }) => {
    await addLessonMutation.mutateAsync(data);
    refetchLessons();
    toast.success("Lesson added");
  };

  const moveLesson = (courseId: string, dragIndex: number, hoverIndex: number) => {
    // Optimistic update
    setLocalCourses((prev) => {
      const newCourses = [...prev];
      const courseIndex = newCourses.findIndex(c => c.courseId === courseId);
      if (courseIndex === -1) return prev;
      const lessonsCopy = [...(newCourses[courseIndex].lessons || [])];
      const draggedLesson = lessonsCopy[dragIndex];
      lessonsCopy.splice(dragIndex, 1);
      lessonsCopy.splice(hoverIndex, 0, draggedLesson);
      newCourses[courseIndex] = { ...newCourses[courseIndex], lessons: lessonsCopy };
      return newCourses;
    });
    // Prepare updates for API
    const currentCourse = localCourses.find(c => c.courseId === courseId);
    const updatedLessons = currentCourse?.lessons || [];
    const updates = updatedLessons.map((lesson: any, idx: number) => ({
      lessonId: lesson.id,
      newOrder: idx,
    }));
    reorderMutation.mutate(updates, {
      onError: () => {
        refetchLessons(); // revert on error
        toast.error("Reorder failed");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <Navbar userRole="teacher" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-semibold mb-2">Teacher Dashboard</h2>
          <p className="text-muted-foreground">Manage your courses and track student activity</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side – Course Management */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <Card className="shadow-lg border-blue-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      My Courses
                    </CardTitle>
                    <CardDescription>Manage your courses and lessons</CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Course</DialogTitle>
                        <DialogDescription>Add a new course to your teaching portfolio</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="course-name">Course Name</Label>
                          <Input id="course-name" placeholder="e.g., Introduction to Python" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="course-description">Description</Label>
                          <Textarea id="course-description" placeholder="Brief description..." value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateCourse} disabled={createCourseMutation.isPending}>
                          {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">

{coursesLoading ? (
  [...Array(3)].map((_, i) => (
    <div key={i} className="rounded-xl border border-blue-200 bg-white shadow p-5 space-y-3 animate-pulse">
      <div className="h-4 w-2/3 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-5 w-24 bg-muted rounded-full" />
        <div className="h-5 w-16 bg-muted rounded-full" />
      </div>
    </div>
  ))
) : (
                      localCourses.map((course: any) => (
                        <Card key={course.courseId} className={`border-blue-200 cursor-pointer ${selectedCourseId === course.courseId ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedCourseId(course.courseId)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-grow">
                                <CardTitle className="text-base">{course.title}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-1" />{course.enrolledCount} students</Badge>
                                  <Badge variant="outline" className="text-xs">{course.lessons?.length || 0} lessons</Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {selectedCourseId === course.courseId && lessonsLoading && <p>Loading lessons...</p>}
                            {selectedCourseId === course.courseId && !lessonsLoading && lessons && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground mb-2">Drag to reorder lessons</p>
                                {lessons.map((lesson: any, idx: number) => (
                                  <DraggableLesson key={lesson.id} lesson={lesson} index={idx} courseId={course.courseId} moveLesson={moveLesson} />
                                ))}
                                <AddLessonDialog
                                  nextOrder={lessons.length}
                                  onAdd={handleAddLesson}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right side – Live Activity Feed */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-lg border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>Real-time student activity updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                      {activities.map((activity: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: 20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -20, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div className="mt-0.5">
                            {activity.type === "enrollment" && <UserPlus className="w-4 h-4 text-blue-500" />}
                            {activity.type === "completion" && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {activity.type === "progress" && <Clock className="w-4 h-4 text-orange-500" />}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm">{activity.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}