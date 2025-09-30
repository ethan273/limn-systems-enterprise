"use client";

import { useState } from "react";
import { api as _api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GitBranch,
  Plus,
  ArrowRight,
  ArrowDown,
  Link2,
  Unlink,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  MoreVertical,
  Trash2 as _Trash2,
} from "lucide-react";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type DependencyType = 'depends_on' | 'blocks';

interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  fromTask: {
    id: string;
    title: string;
    status: TaskStatus;
  };
  toTask: {
    id: string;
    title: string;
    status: TaskStatus;
  };
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

interface TaskDependenciesProps {
  taskId: string;
  onUpdate?: () => void;
}

// Mock dependencies created outside component to prevent recreation on re-render
const createMockDependencies = (taskId: string): TaskDependency[] => [
  {
    id: "1",
    fromTaskId: taskId,
    toTaskId: "task-2",
    type: 'depends_on',
    fromTask: { id: taskId, title: "Current Task", status: 'in_progress' },
    toTask: { id: "task-2", title: "Setup database schema", status: 'completed' },
  },
  {
    id: "2",
    fromTaskId: "task-3",
    toTaskId: taskId,
    type: 'depends_on',
    fromTask: { id: "task-3", title: "Create frontend components", status: 'todo' },
    toTask: { id: taskId, title: "Current Task", status: 'in_progress' },
  },
  {
    id: "3",
    fromTaskId: taskId,
    toTaskId: "task-4",
    type: 'blocks',
    fromTask: { id: taskId, title: "Current Task", status: 'in_progress' },
    toTask: { id: "task-4", title: "Deploy to production", status: 'todo' },
  },
];

export default function TaskDependencies({ taskId, onUpdate }: TaskDependenciesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [dependencyType, setDependencyType] = useState<DependencyType>('depends_on');

  // Mock data - in production this would come from API
  const [dependencies, setDependencies] = useState<TaskDependency[]>(() => createMockDependencies(taskId));

  const [availableTasks] = useState<Task[]>([
    { id: "task-2", title: "Setup database schema", status: 'completed' },
    { id: "task-3", title: "Create frontend components", status: 'todo' },
    { id: "task-4", title: "Deploy to production", status: 'todo' },
    { id: "task-5", title: "Write documentation", status: 'todo' },
    { id: "task-6", title: "Code review", status: 'in_progress' },
    { id: "task-7", title: "Security audit", status: 'todo' },
  ]);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <AlertTriangle className="h-3 w-3 text-gray-400" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case 'cancelled':
        return <X className="h-3 w-3 text-red-400" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/20';
    }
  };

  const _getDependencyIcon = (type: DependencyType) => {
    return type === 'depends_on' ? <ArrowRight className="h-4 w-4" /> : <Link2 className="h-4 w-4" />;
  };

  const _getDependencyColor = (type: DependencyType) => {
    return type === 'depends_on'
      ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
      : 'text-orange-400 border-orange-400/30 bg-orange-400/10';
  };

  const addDependency = () => {
    if (!selectedTaskId) return;

    // Here you would call the API to create the dependency
    console.log('Adding dependency:', {
      fromTaskId: dependencyType === 'depends_on' ? selectedTaskId : taskId,
      toTaskId: dependencyType === 'depends_on' ? taskId : selectedTaskId,
      type: dependencyType,
    });

    setSelectedTaskId("");
    setIsAddDialogOpen(false);
    onUpdate?.();
  };

  const removeDependency = (dependencyId: string) => {
    if (confirm("Are you sure you want to remove this dependency?")) {
      // Remove the dependency from the state
      setDependencies(prev => prev.filter(dep => dep.id !== dependencyId));
      console.log('Removing dependency:', dependencyId);
      onUpdate?.();
    }
  };

  const filteredTasks = availableTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    task.id !== taskId
  );

  // Group dependencies by type
  const dependsOnTasks = dependencies.filter(dep => dep.type === 'depends_on' && dep.toTaskId === taskId);
  const blockingTasks = dependencies.filter(dep => dep.type === 'blocks' && dep.fromTaskId === taskId);
  const blockedByTasks = dependencies.filter(dep => dep.type === 'depends_on' && dep.fromTaskId === taskId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <GitBranch className="h-4 w-4" />
          Dependencies ({dependencies.length})
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Dependency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task Dependency</DialogTitle>
              <DialogDescription>
                Create dependencies between tasks to define workflow relationships.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Dependency Type
                </label>
                <Select
                  value={dependencyType}
                  onValueChange={(value: DependencyType) => setDependencyType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="depends_on">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-400" />
                        This task depends on...
                      </div>
                    </SelectItem>
                    <SelectItem value="blocks">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-orange-400" />
                        This task blocks...
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {dependencyType === 'depends_on'
                    ? "Select a task that must be completed before this one can start"
                    : "Select a task that cannot start until this one is completed"
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Search Tasks
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for a task..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-700/30"
                  >
                    <input
                      type="radio"
                      name="selectedTask"
                      value={task.id}
                      checked={selectedTaskId === task.id}
                      onChange={() => setSelectedTaskId(task.id)}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(task.status)}
                      <span className="text-sm">{task.title}</span>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addDependency}
                  disabled={!selectedTaskId}
                >
                  Add Dependency
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dependencies Display */}
      <div className="space-y-4">
        {/* Tasks this depends on */}
        {dependsOnTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <ArrowDown className="h-3 w-3" />
              DEPENDS ON ({dependsOnTasks.length})
            </h4>
            <div className="space-y-1">
              {dependsOnTasks.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/20 rounded"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(dep.fromTask.status)}
                    <span className="text-sm truncate">{dep.fromTask.title}</span>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(dep.fromTask.status)}`}>
                      {dep.fromTask.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => removeDependency(dep.id)}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Remove Dependency
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks that depend on this */}
        {blockedByTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <ArrowDown className="h-3 w-3" />
              REQUIRED BY ({blockedByTasks.length})
            </h4>
            <div className="space-y-1">
              {blockedByTasks.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/20 rounded"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(dep.toTask.status)}
                    <span className="text-sm truncate">{dep.toTask.title}</span>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(dep.toTask.status)}`}>
                      {dep.toTask.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => removeDependency(dep.id)}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Remove Dependency
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks this blocks */}
        {blockingTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <Link2 className="h-3 w-3" />
              BLOCKS ({blockingTasks.length})
            </h4>
            <div className="space-y-1">
              {blockingTasks.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-2 bg-orange-500/10 border border-orange-500/20 rounded"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(dep.toTask.status)}
                    <span className="text-sm truncate">{dep.toTask.title}</span>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(dep.toTask.status)}`}>
                      {dep.toTask.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => removeDependency(dep.id)}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Remove Dependency
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        {dependencies.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <GitBranch className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No dependencies defined</p>
            <p className="text-xs text-gray-600">Add dependencies to show task relationships</p>
          </div>
        )}
      </div>
    </div>
  );
}