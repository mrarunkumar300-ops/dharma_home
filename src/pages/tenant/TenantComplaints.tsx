import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTenantComplaints } from "@/hooks/useTenantComplaints";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Camera,
  Upload,
  X,
  Zap,
  Droplet,
  Wrench,
  Hammer,
  PaintBucket,
  Bug,
  Shield,
  FileText,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

const complaintCategories = [
  { value: "electricity", label: "Electricity", icon: Zap, color: "text-yellow-600" },
  { value: "water", label: "Water", icon: Droplet, color: "text-blue-600" },
  { value: "cleaning", label: "Cleaning", icon: Wrench, color: "text-green-600" },
  { value: "plumbing", label: "Plumbing", icon: Wrench, color: "text-gray-600" },
  { value: "carpentry", label: "Carpentry", icon: Hammer, color: "text-orange-600" },
  { value: "painting", label: "Painting", icon: PaintBucket, color: "text-purple-600" },
  { value: "pest_control", label: "Pest Control", icon: Bug, color: "text-red-600" },
  { value: "security", label: "Security", icon: Shield, color: "text-indigo-600" },
  { value: "other", label: "Other", icon: FileText, color: "text-gray-600" },
];

const priorityLevels = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
  in_progress: { icon: AlertTriangle, color: "text-blue-600 bg-blue-50", label: "In Progress" },
  resolved: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Resolved" },
  cancelled: { icon: X, color: "text-gray-600 bg-gray-50", label: "Cancelled" },
};

const TenantComplaints = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const {
    complaints,
    isLoading,
    createComplaint,
    complaintStats,
    statsLoading,
    uploadComplaintImages,
  } = useTenantComplaints();

  const filteredComplaints = complaints?.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         complaint.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateComplaint = async () => {
    if (!selectedCategory || !title.trim() || !description.trim()) {
      return;
    }

    try {
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        imageUrls = await uploadComplaintImages(uploadedImages);
      }

      await createComplaint.mutateAsync({
        category: selectedCategory as any,
        title: title.trim(),
        description: description.trim(),
        priority: selectedPriority as any,
        image_urls: imageUrls,
      });

      // Reset form
      setSelectedCategory("");
      setSelectedPriority("medium");
      setTitle("");
      setDescription("");
      setUploadedImages([]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating complaint:", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      alert("Some files were rejected. Please ensure all files are images under 5MB.");
    }

    setUploadedImages(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.color || "text-gray-600 bg-gray-50";
  };

  const getStatusIcon = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig]?.icon || Clock;
  };

  const getCategoryIcon = (category: string) => {
    return complaintCategories.find(c => c.value === category)?.icon || FileText;
  };

  const getCategoryColor = (category: string) => {
    return complaintCategories.find(c => c.value === category)?.color || "text-gray-600";
  };

  const getPriorityColor = (priority: string) => {
    return priorityLevels.find(p => p.value === priority)?.color || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Complaints & Maintenance</h1>
            <p className="text-muted-foreground mt-1">Report and track maintenance issues</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Complaint</DialogTitle>
                <DialogDescription>
                  Report a maintenance issue or complaint. We'll address it as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Category</label>
                  <div className="grid grid-cols-3 gap-3">
                    {complaintCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <Button
                          key={category.value}
                          variant={selectedCategory === category.value ? "default" : "outline"}
                          className="h-20 flex-col gap-2"
                          onClick={() => setSelectedCategory(category.value)}
                        >
                          <Icon className={`w-6 h-6 ${selectedCategory === category.value ? "" : category.color}`} />
                          <span className="text-xs">{category.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Priority Level</label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <Badge className={priority.color}>{priority.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title and Description */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title *</label>
                    <Input
                      placeholder="Brief description of the issue"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description *</label>
                    <Textarea
                      placeholder="Detailed description of the issue"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={1000}
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload images</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each (max 5 images)</span>
                    </label>
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateComplaint}
                    disabled={!selectedCategory || !title.trim() || !description.trim() || createComplaint.isPending}
                  >
                    {createComplaint.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Submit Complaint
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        {!statsLoading && complaintStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Complaints</p>
                    <p className="text-2xl font-bold">{complaintStats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{complaintStats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{complaintStats.in_progress}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{complaintStats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No complaints found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Create your first complaint to get started"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Complaint
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredComplaints.map((complaint, index) => {
                const StatusIcon = getStatusIcon(complaint.status);
                const CategoryIcon = getCategoryIcon(complaint.category);
                
                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setIsDetailDialogOpen(true);
                          }}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CategoryIcon className={`w-5 h-5 ${getCategoryColor(complaint.category)}`} />
                              <h3 className="font-semibold">{complaint.title}</h3>
                              <Badge className={getPriorityColor(complaint.priority)}>
                                {complaint.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {complaint.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <StatusIcon className="w-4 h-4" />
                                <Badge className={getStatusColor(complaint.status)}>
                                  {statusConfig[complaint.status as keyof typeof statusConfig]?.label}
                                </Badge>
                              </div>
                              <span>Created {format(new Date(complaint.created_at), "MMM d, yyyy")}</span>
                              {complaint.image_urls && complaint.image_urls.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Camera className="w-4 h-4" />
                                  <span>{complaint.image_urls.length} images</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TenantComplaints;
