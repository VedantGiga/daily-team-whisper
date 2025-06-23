import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Settings, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastNotification } from '@/hooks/useToastNotification';

// Define widget types
export type WidgetType = 'github' | 'calendar' | 'summary' | 'team' | 'analytics';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  isCollapsed?: boolean;
}

interface DraggableDashboardProps {
  userId: number;
  defaultWidgets?: Widget[];
}

export const DraggableDashboard = ({ userId, defaultWidgets }: DraggableDashboardProps) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToastNotification();

  // Load saved layout from localStorage or use default
  useEffect(() => {
    const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`);
    if (savedLayout) {
      try {
        setWidgets(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Failed to parse saved layout', e);
        setWidgets(defaultWidgets || getDefaultWidgets());
      }
    } else {
      setWidgets(defaultWidgets || getDefaultWidgets());
    }
  }, [userId, defaultWidgets]);

  // Save layout to localStorage when it changes
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setWidgets(updatedItems);
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {widgets
                .sort((a, b) => a.position - b.position)
                .map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={!isEditing}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${getSizeClass(widget.size)} transition-all duration-300 ease-in-out`}
                      >
                        <Card className="h-full shadow-md">
                          <CardHeader className="flex flex-row items-center justify-between py-3">
                            <CardTitle
                              {...(isEditing ? provided.dragHandleProps : {})}
                              className={`text-sm font-medium ${isEditing ? 'cursor-grab' : ''}`}
                            >
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
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};