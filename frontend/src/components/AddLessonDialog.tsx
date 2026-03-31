 import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  order: z.number().min(0),
});

type LessonForm = z.infer<typeof lessonSchema>;

export function AddLessonDialog({
  nextOrder,
  onAdd,
}: {
  nextOrder: number;
  onAdd: (data: { title: string; content?: string; order: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '', content: '', order: nextOrder },
  });

  const onSubmit = async (data: LessonForm) => {
    await onAdd(data);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content (optional)</Label>
            <Textarea id="content" {...register('content')} rows={4} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Order (0-based)</Label>
            <Input
              id="order"
              type="number"
              {...register('order', { valueAsNumber: true })}
            />
            {errors.order && (
              <p className="text-sm text-red-500">{errors.order.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Lesson'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}