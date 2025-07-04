import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Users, UserPlus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  department: string;
  employee_id: string;
  role?: string;
}

interface UserRoleManagerProps {
  onUserRoleAssigned?: () => void;
}

export function UserRoleManager({ onUserRoleAssigned }: UserRoleManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("Fetching users for role management...");

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, position, department, employee_id");

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      console.log(`Found ${profiles?.length || 0} profiles`);

      // Get existing roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.warn("Error fetching roles:", rolesError);
      }

      // Combine data
      const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      const usersWithRoles =
        profiles?.map((profile) => ({
          ...profile,
          role: rolesMap.get(profile.user_id) || null,
        })) || [];

      console.log("Users with role status:", usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignUserRole = async (userId: string, fullName: string) => {
    try {
      setAssigningRole(userId);
      console.log(`Assigning role to user: ${fullName} (${userId})`);

      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "user",
      });

      if (error) {
        throw new Error(`Failed to assign role: ${error.message}`);
      }

      toast({
        title: "Success",
        description: `Assigned "user" role to ${fullName}`,
      });

      // Refresh the list
      await fetchUsers();

      // Notify parent component
      if (onUserRoleAssigned) {
        onUserRoleAssigned();
      }
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: `Failed to assign role to ${fullName}`,
        variant: "destructive",
      });
    } finally {
      setAssigningRole(null);
    }
  };

  const assignAllRoles = async () => {
    const usersWithoutRoles = users.filter((user) => !user.role);

    if (usersWithoutRoles.length === 0) {
      toast({
        title: "Info",
        description: "All users already have roles assigned",
      });
      return;
    }

    try {
      setLoading(true);
      console.log(`Assigning roles to ${usersWithoutRoles.length} users`);

      const rolesToInsert = usersWithoutRoles.map((user) => ({
        user_id: user.user_id,
        role: "user",
      }));

      const { error } = await supabase.from("user_roles").insert(rolesToInsert);

      if (error) {
        throw new Error(`Failed to assign roles: ${error.message}`);
      }

      toast({
        title: "Success",
        description: `Assigned "user" role to ${usersWithoutRoles.length} users`,
      });

      // Refresh the list
      await fetchUsers();

      if (onUserRoleAssigned) {
        onUserRoleAssigned();
      }
    } catch (error: any) {
      console.error("Error assigning roles:", error);
      toast({
        title: "Error",
        description: "Failed to assign roles to users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const usersWithoutRoles = users.filter((user) => !user.role);

  return (
    <Card className="mb-6 shadow-card border border-border bg-gradient-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
            <Users className="w-5 h-5 text-primary" />
            User Role Management
          </CardTitle>
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola peran pengguna yang telah ditambahkan ke database
        </p>
      </CardHeader>

      <CardContent>
        {usersWithoutRoles.length > 0 && (
          <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm font-medium text-warning-foreground mb-2">
              {usersWithoutRoles.length} pengguna belum memiliki role
            </p>
            <Button
              onClick={assignAllRoles}
              disabled={loading}
              className="bg-gradient-accent hover:shadow-lg text-accent-foreground"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Role ke Semua User
            </Button>
          </div>
        )}

        <ScrollArea className="h-64">
          {loading ? (
            <LoadingSpinner message="Loading users..." />
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Tidak ada pengguna ditemukan
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {user.full_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {user.position} • {user.employee_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.role ? (
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                        className={
                          user.role === "admin"
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }
                      >
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    ) : (
                      <Button
                        onClick={() =>
                          assignUserRole(user.user_id, user.full_name)
                        }
                        disabled={assigningRole === user.user_id}
                        size="sm"
                        className="bg-gradient-secondary text-white hover:shadow-lg"
                      >
                        {assigningRole === user.user_id ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Assign Role
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
