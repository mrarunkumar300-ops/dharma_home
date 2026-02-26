import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTenantNotifications } from "@/hooks/useTenantNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Home,
  MessageSquare,
  Settings,
  Mail,
  Smartphone,
  Volume2,
  Eye,
  EyeOff,
  X,
  Calendar,
  Clock,
  Filter,
  Search,
  Loader2,
  Trash2,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { CurrencyIcon } from "@/components/CurrencyIcon";

const notificationTypes = [
  { value: "rent_due", label: "Rent Due", icon: CurrencyIcon, color: "text-yellow-600" },
  { value: "overdue", label: "Overdue", icon: AlertTriangle, color: "text-red-600" },
  { value: "maintenance", label: "Maintenance", icon: Home, color: "text-blue-600" },
  { value: "agreement_expiry", label: "Agreement Expiry", icon: Calendar, color: "text-orange-600" },
  { value: "announcement", label: "Announcement", icon: Info, color: "text-purple-600" },
  { value: "payment_received", label: "Payment Received", icon: CheckCircle, color: "text-green-600" },
  { value: "complaint_update", label: "Complaint Update", icon: MessageSquare, color: "text-indigo-600" },
  { value: "system", label: "System", icon: Settings, color: "text-gray-600" },
];

const priorityLevels = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

const channels = [
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: Smartphone },
  { value: "push", label: "Push", icon: Bell },
  { value: "in_app", label: "In-App", icon: Volume2 },
];

const frequencies = [
  { value: "immediate", label: "Immediate" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Summary" },
  { value: "never", label: "Never" },
];

const TenantNotifications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, any>>({});

  const {
    notifications,
    isLoading,
    unreadCount,
    preferences: savedPreferences,
    preferencesLoading,
    notificationStats,
    statsLoading,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    deleteNotification,
  } = useTenantNotifications();

  // Initialize preferences from saved data
  useState(() => {
    if (savedPreferences.length > 0) {
      const prefs: Record<string, any> = {};
      savedPreferences.forEach((pref) => {
        prefs[pref.notification_type] = {
          email_enabled: pref.email_enabled,
          sms_enabled: pref.sms_enabled,
          push_enabled: pref.push_enabled,
          in_app_enabled: pref.in_app_enabled,
          frequency: pref.frequency,
        };
      });
      setPreferences(prefs);
    }
  });

  const filteredNotifications = notifications?.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (notification.message && notification.message.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || notification.priority === priorityFilter;
    const matchesRead = !showUnreadOnly || !notification.is_read;
    return matchesSearch && matchesType && matchesPriority && matchesRead;
  }) || [];

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleUpdatePreferences = async () => {
    const prefArray = Object.entries(preferences).map(([type, settings]) => ({
      notification_type: type,
      ...settings,
    }));
    
    await updatePreferences.mutateAsync(prefArray);
    setIsSettingsDialogOpen(false);
  };

  const handlePreferenceChange = (type: string, channel: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value,
      },
    }));
  };

  const handleFrequencyChange = (type: string, frequency: string) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        frequency,
      },
    }));
  };

  const getNotificationIcon = (type: string) => {
    return notificationTypes.find(n => n.value === type)?.icon || Bell;
  };

  const getNotificationColor = (type: string) => {
    return notificationTypes.find(n => n.value === type)?.color || "text-gray-600";
  };

  const getPriorityColor = (priority: string) => {
    return priorityLevels.find(p => p.value === priority)?.color || "bg-gray-100 text-gray-800";
  };

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getChannelIcon = (channel: string) => {
    return channels.find(c => c.value === channel)?.icon || Bell;
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead} disabled={markAllAsRead.isPending}>
                {markAllAsRead.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark All Read
              </Button>
            )}
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Notification Preferences</DialogTitle>
                  <DialogDescription>
                    Choose how you want to receive different types of notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {notificationTypes.map((type) => {
                      const Icon = type.icon;
                      const typePrefs = preferences[type.value] || {
                        email_enabled: true,
                        sms_enabled: false,
                        push_enabled: true,
                        in_app_enabled: true,
                        frequency: 'immediate',
                      };
                      
                      return (
                        <div key={type.value} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <Icon className={`w-5 h-5 ${type.color}`} />
                            <h3 className="font-medium">{type.label}</h3>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-4">
                              {channels.map((channel) => {
                                const ChannelIcon = channel.icon;
                                return (
                                  <div key={channel.value} className="flex items-center gap-2">
                                    <ChannelIcon className="w-4 h-4" />
                                    <Switch
                                      checked={typePrefs[`${channel.value}_enabled`]}
                                      onCheckedChange={(checked) => 
                                        handlePreferenceChange(type.value, `${channel.value}_enabled`, checked)
                                      }
                                    />
                                    <span className="text-sm">{channel.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">Frequency:</span>
                              <Select
                                value={typePrefs.frequency}
                                onValueChange={(value) => handleFrequencyChange(type.value, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {frequencies.map((freq) => (
                                    <SelectItem key={freq.value} value={freq.value}>
                                      {freq.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdatePreferences} disabled={updatePreferences.isPending}>
                      {updatePreferences.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        {!statsLoading && notificationStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{notificationStats.total}</p>
                  </div>
                  <Bell className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unread</p>
                    <p className="text-2xl font-bold text-yellow-600">{notificationStats.unread}</p>
                  </div>
                  <BellRing className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Urgent</p>
                    <p className="text-2xl font-bold text-red-600">{notificationStats.urgent}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 24h</p>
                    <p className="text-2xl font-bold text-green-600">{notificationStats.recent_24h}</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-600" />
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
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {notificationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className={`w-4 h-4 ${type.color}`} />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {priorityLevels.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  <Badge className={priority.color}>{priority.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              checked={showUnreadOnly}
              onCheckedChange={setShowUnreadOnly}
            />
            <span className="text-sm">Unread only</span>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || typeFilter !== "all" || priorityFilter !== "all" || showUnreadOnly
                    ? "Try adjusting your search or filters"
                    : "You're all caught up! No new notifications."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const isUnread = !notification.is_read;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={`${isUnread ? "border-l-4 border-l-primary bg-primary/5" : ""}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className={`w-5 h-5 ${getNotificationColor(notification.type)}`} />
                              <h3 className={`font-semibold ${isUnread ? "" : "text-muted-foreground"}`}>
                                {notification.title}
                              </h3>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {isUnread && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            
                            {notification.message && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {notification.message}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>{getTimeAgo(notification.created_at)}</span>
                              {notification.channels && notification.channels.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {notification.channels.slice(0, 3).map((channel) => {
                                    const ChannelIcon = getChannelIcon(channel);
                                    return (
                                      <ChannelIcon key={channel} className="w-3 h-3" />
                                    );
                                  })}
                                  {notification.channels.length > 3 && (
                                    <span className="text-xs">+{notification.channels.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {notification.action_url && (
                              <Button variant="outline" size="sm" className="mb-3">
                                {notification.action_text || "View Details"}
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {isUnread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={markAsRead.isPending}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification.mutate(notification.id)}
                              disabled={deleteNotification.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

export default TenantNotifications;
