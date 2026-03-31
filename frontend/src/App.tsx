import { ThemeProvider } from 'next-themes';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DndProvider backend={HTML5Backend}>
        <RouterProvider router={router} />
        <Toaster />
      </DndProvider>
    </ThemeProvider>
  );
}