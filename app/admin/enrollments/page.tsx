"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getAllEnrollments, updateEnrollmentStatus } from "@/lib/enrollment";
import type { UserEnrollment } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Plus, CheckCircle } from "lucide-react";
import { ManualEnrollmentModal } from "@/components/admin/manual-enrollment-modal";

function formatDate(d: Date): string {
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function AdminEnrollmentsPage() {
  const [rows, setRows] = useState<UserEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAllEnrollments();
      setRows(list);
    } catch {
      setError("Could not load enrollments. Sign in as an admin and check Firestore rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((e) => {
      const name = `${e.personalInfo?.firstName ?? ""} ${e.personalInfo?.lastName ?? ""}`.toLowerCase();
      const email = (e.userEmail || e.personalInfo?.email || "").toLowerCase();
      const course = (e.courseTitle || "").toLowerCase();
      const ref = (e.paymentReference || "").toLowerCase();
      return name.includes(q) || email.includes(q) || course.includes(q) || ref.includes(q);
    });
  }, [rows, query]);

  const handleMarkCompleted = async (enrollmentId: string) => {
    setUpdatingId(enrollmentId);
    try {
      await updateEnrollmentStatus(enrollmentId, 'completed');
      toast({
        title: "Success",
        description: "Enrollment marked as completed.",
      });
      load(); // Refresh the list
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const uniqueStudents = useMemo(() => new Set(rows.map((e) => e.userId)).size, [rows]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading enrollments…
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 text-destructive">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Course enrollments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage student enrollments and track course completion status.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span>
                <span className="text-muted-foreground">Registrations: </span>
                <strong>{rows.length}</strong>
              </span>
              <span>
                <span className="text-muted-foreground">Distinct students: </span>
                <strong>{uniqueStudents}</strong>
              </span>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Manually Enroll Student
          </Button>
        </div>

        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, course, or payment ref…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Course</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {rows.length === 0
                      ? "No enrollments yet. Registrations appear here after students pay on the course registration flow."
                      : "No rows match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {[e.personalInfo?.firstName, e.personalInfo?.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.userEmail || e.personalInfo?.email || "—"}</td>
                    <td className="px-4 py-3 text-foreground max-w-[220px]">{e.courseTitle || e.courseId}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(e.enrollmentDate instanceof Date ? e.enrollmentDate : new Date(e.enrollmentDate))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="font-mono text-xs">{e.paymentReference || "—"}</span>
                      {e.paymentAmount != null && (
                        <span className="block text-xs mt-0.5">
                          {e.paymentMethod} · {e.paymentAmount}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={e.status === "completed" ? "success" : e.status === "active" ? "default" : "secondary"}>
                        {e.status || "active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkCompleted(e.id)}
                          disabled={updatingId === e.id}
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {updatingId === e.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                          Mark completed
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ManualEnrollmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={load} 
      />
    </AdminLayout>
  );
}
