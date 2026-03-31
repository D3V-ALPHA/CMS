/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/navbar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../components/ui/pagination";
import { Search, BookOpen, User, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useCourses, useEnroll, useStudentProgress } from "@/hooks/useCourses";
import { useAuthStore } from "@/stores/authStore";
import { CourseModal } from "@/components/CourseModal";

export function StudentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 6;

  const { data, isLoading, refetch: refetchCourses } = useCourses({ search: searchQuery, page: currentPage, limit });
  const { data: progressData, refetch: refetchProgress } = useStudentProgress();
  const enrollMutation = useEnroll();

  useEffect(() => {
    if (user && user.role !== "student") navigate("/");
  }, [user, navigate]);
  useEffect(() => { document.title = "Student Portal — CMS"; }, []);

  const handleEnroll = async (courseId: string) => {
    await enrollMutation.mutateAsync(courseId);
    await refetchProgress();
    await refetchCourses();
    toast.success("Enrolled successfully!");
  };

  const handleContinue = (course: any) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const isEnrolled = (courseId: string) => {
    return progressData?.some((p: any) => p.courseId === courseId);
  };

  const getProgress = (courseId: string) => {
    const enrolled = progressData?.find((p: any) => p.courseId === courseId);
    return enrolled ? enrolled.completionPercentage : 0;
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <Navbar userRole="student" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-semibold mb-2">Browse Courses</h2>
          <p className="text-muted-foreground">Explore and enroll in courses to expand your knowledge</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search courses, teachers, or topics..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 py-6 text-base bg-white shadow-sm"
            />
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

{isLoading ? (
  [...Array(6)].map((_, i) => (
    <div key={i} className="rounded-xl border border-blue-100 bg-white shadow-md p-6 space-y-4 animate-pulse">
      <div className="h-4 w-20 bg-muted rounded" />
      <div className="h-5 w-3/4 bg-muted rounded" />
      <div className="h-3 w-1/2 bg-muted rounded" />
      <div className="h-16 bg-muted rounded" />
      <div className="h-3 w-1/3 bg-muted rounded" />
      <div className="h-9 bg-muted rounded-lg mt-4" />
    </div>
  ))
) : (
            data?.data.map((course: any, index: number) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} whileHover={{ y: -4 }}>
                <Card className="h-full flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300 border-blue-100">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={isEnrolled(course.id) ? "default" : "secondary"} className="mb-2">
                        {isEnrolled(course.id) ? "Enrolled" : "Available"}
                      </Badge>
                      {isEnrolled(course.id) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3" />
                          {Math.round(getProgress(course.id))}%
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl leading-tight">{course.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <User className="w-3 h-3" />
                      {course.teacherEmail || course.teacherId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration || "8 weeks"}</div>
                      <div className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.students || 0} students</div>
                    </div>
                    {isEnrolled(course.id) && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{Math.round(getProgress(course.id))}% complete</span>
                        </div>
                        <Progress value={getProgress(course.id)} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isEnrolled(course.id) ? "outline" : "default"}
                      onClick={() => {
                        if (isEnrolled(course.id)) {
                          handleContinue(course);
                        } else {
                          handleEnroll(course.id);
                        }
                      }}
                    >
                      {isEnrolled(course.id) ? "Continue Learning" : "Enroll Now"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p-1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i+1}>
                    <PaginationLink onClick={() => setCurrentPage(i+1)} isActive={currentPage === i+1} className="cursor-pointer">{i+1}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </div>

      <CourseModal
        course={selectedCourse}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onProgressUpdate={() => {
          refetchProgress();
          refetchCourses();
        }}
      />
    </div>
  );
}