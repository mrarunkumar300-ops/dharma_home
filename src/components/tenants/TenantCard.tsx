import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Calendar, 
  FileText, 
  Edit, 
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock,
  Key,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CurrencyIcon } from "@/components/CurrencyIcon";

interface TenantCardProps {
  tenant: any;
  onEdit?: (tenant: any) => void;
  onViewAgreement?: (tenant: any) => void;
  onStatusChange?: (tenantId: string, status: string) => void;
  className?: string;
}

export const TenantCard = ({ 
  tenant, 
  onEdit, 
  onViewAgreement, 
  onStatusChange,
  className 
}: TenantCardProps) => {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/admin/tenants/${tenant.id}`);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expiring':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <Clock className="w-4 h-4" />;
      case 'expiring':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const isLeaseExpiringSoon = () => {
    if (!tenant.lease_end) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(tenant.lease_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const daysUntilExpiry = () => {
    if (!tenant.lease_end) return null;
    return Math.ceil(
      (new Date(tenant.lease_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn("group", className)}
    >
      <Card 
        className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary cursor-pointer"
        onClick={handleViewDetails}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{tenant.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs flex items-center gap-1", getStatusColor(tenant.status))}
                  >
                    {getStatusIcon(tenant.status)}
                    {tenant.status}
                  </Badge>
                  {isLeaseExpiringSoon() && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {daysUntilExpiry()} days left
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(tenant)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Tenant
                </DropdownMenuItem>
                {tenant.agreement_document_url && (
                  <DropdownMenuItem onClick={() => onViewAgreement?.(tenant)}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Agreement
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onStatusChange?.(tenant.id, tenant.status === 'active' ? 'inactive' : 'active')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {tenant.status === 'active' ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            {tenant.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{tenant.email}</span>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{tenant.phone}</span>
              </div>
            )}
          </div>

          {/* Room Assignment */}
          {tenant.units && Array.isArray(tenant.units) && tenant.units.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Room Assignment</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{tenant.units[0].unit_number}</span>
                  <Badge variant="secondary" className="text-xs">
                    {tenant.units[0].properties?.name || 'Unknown Property'}
                  </Badge>
                </div>
                {tenant.units[0].rent && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CurrencyIcon className="w-3 h-3" />
                    <span>{formatAmount(tenant.units[0].rent)}/month</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Information */}
          {tenant.rent_amount && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <CurrencyIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Rent</span>
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {formatAmount(tenant.rent_amount)}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Key className="w-4 h-4" />
                  <span className="text-xs font-medium">Deposit</span>
                </div>
                <div className="text-lg font-bold text-green-700">
                  {formatAmount(tenant.security_deposit || 0)}
                </div>
              </div>
            </div>
          )}

          {/* Lease Information */}
          {(tenant.lease_start || tenant.lease_end) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {tenant.lease_start && format(new Date(tenant.lease_start), 'MMM d, yyyy')}
                {tenant.lease_start && tenant.lease_end && ' - '}
                {tenant.lease_end && format(new Date(tenant.lease_end), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Agreement Document */}
          {tenant.agreement_document_url && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Agreement uploaded</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
