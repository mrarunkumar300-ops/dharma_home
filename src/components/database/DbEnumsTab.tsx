import { useState } from "react";
import { useEnums, useAddEnumValue } from "@/hooks/useDatabaseManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Tag, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const DbEnumsTab = () => {
  const qc = useQueryClient();
  const { data: enumsData, isLoading } = useEnums();
  const addEnumValue = useAddEnumValue();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEnum, setSelectedEnum] = useState("");
  const [newValue, setNewValue] = useState("");

  const enums = enumsData?.enums || [];

  const handleAdd = () => {
    addEnumValue.mutate(
      { enumName: selectedEnum, value: newValue },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewValue("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading enums...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Database Enums</h3>
        <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["db-enums"] })}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {enums.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No enums found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enums.map((en: any) => (
            <Card key={en.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono">{en.name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    setSelectedEnum(en.name);
                    setAddDialogOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Value
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(en.values || []).map((v: string) => (
                    <Badge key={v} variant="secondary" className="font-mono text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Enum Value</DialogTitle>
            <DialogDescription>
              Add a new value to <strong className="font-mono">{selectedEnum}</strong>.
              Note: Enum values cannot be removed once added in PostgreSQL.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>New Value</Label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. moderator"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newValue || addEnumValue.isPending}>
              {addEnumValue.isPending ? "Adding..." : "Add Value"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
