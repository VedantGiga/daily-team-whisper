import { useState, useEffect, DragEvent } from 'react';
import { Settings, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastNotification } from '@/hooks/useToastNotification';

export type WidgetType = 'github' | 'calendar' | 'summary' | 'team' | 'analytics';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  isCollapsed?: boolean;
}

interface SimpleDraggableDashboardProps {
  userId: number;
  defaultWidgets?: Widget[];
}

export const SimpleDraggableDashboard = ({ userId, defaultWidgets }: SimpleDraggableDashboardProps) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const toast = useToastNotification();

  useEffect(() => {
    const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`);
    if (savedLayout) {
      try {
        setWidgets(JSON.parse(savedLayout));
      } catch (e) {
        setWidgets(defaultWidgets || getDefaultWidgets());
      }
    } else {
      setWidgets(defaultWidgets || getDefaultWidgets());
    }
  }, [userId, defaultWidgets]);

  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(widgets));
    }
  }, [widgets, userId]);

  const getDefaultWidgets = (): Widget[] => [
    { id: 'github-activity', type: 'github', title: 'GitHub Activity', size: 'medium', position: 0 },
    { id: 'calendar-events', type: 'calendar', title: 'Calendar Events', size: 'medium', position: 1 },
    { id: 'daily-summary', type: 'summary', title: 'Daily Summary', size: 'large', position: 2 },
    { id: 'team-activity', type: 'team', title: 'Team Activity', size: 'small', position: 3 },
    { id: 'analytics', type: 'analytics', title: 'Analytics', size: 'medium', position: 4 },
  ];

  const handleDragStart = (e: DragEvent<HTMLDivElement>, widgetId: string) => {
    if (!isEditing) return;
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', widgetId);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetWidgetId: string) => {
    if (!isEditing || !draggedWidget) return;
    e.preventDefault();

    if (draggedWidget === targetWidgetId) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [draggedItem] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedItem);

    // Update positions
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      position: index,
    }));

    setWidgets(updatedWidgets);
    setDraggedWidget(null);
    toast.success('Dashboard layout updated');
  };

  const toggleWidgetSize = (id: string) => {
    setWidgets(
      widgets.map((widget) => {
        if (widget.id === id) {
          const sizes: Record<string, 'small' | 'medium' | 'large'> = {
            small: 'medium',
            medium: 'large',
            large: 'small',
          };
          return { ...widget, size: sizes[widget.size] };
        }
        return widget;
      })
    );
  };

  const toggleWidgetCollapse = (id: string) => {
    setWidgets(
      widgets.map((widget) => {
        if (widget.id === id) {
          return { ...widget, isCollapsed: !widget.isCollapsed };
        }
        return widget;
      })
    );
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {isEditing ? 'Save Layout' : 'Customize Layout'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {widgets
          .sort((a, b) => a.position - b.position)
          .map((widget) => (
            <div
              key={widget.id}
              className={`${getSizeClass(widget.size)} transition-all duration-300 ease-in-out ${
                isEditing ? 'cursor-move' : ''
              } ${draggedWidget === widget.id ? 'opacity-50' : ''}`}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, widget.id)}
            >
              <Card className="h-full shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {isEditing && (
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    )}
                    {widget.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleWidgetSize(widget.id)}
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleWidgetCollapse(widget.id)}
                    >
                      {widget.isCollapsed ? (
                        <Maximize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Minimize2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {!widget.isCollapsed && (
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                      <p className="text-muted-foreground">Widget content for {widget.type}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          ))}
      </div>
    </div>
  );
};