"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { formatThaiDateTimeShort } from "@/lib/format-date";
import { toastConfirm, toastDeleted, toastError, toastSaved } from "@/lib/toast";

export type TaskCommentItem = {
  id: string;
  body: string;
  created_at: string;
  user_id: string | null;
  author_name: string;
};

export function TaskCommentsPanel({
  taskId,
  initialComments,
  canEdit,
  currentUserId,
  isAdmin
}: {
  taskId: string;
  initialComments: TaskCommentItem[];
  canEdit: boolean;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      const created = (await response.json()) as TaskCommentItem;
      setComments((prev) => [created, ...prev]);
      setBody("");
      toastSaved("บันทึกความคิดเห็นแล้ว");
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  function remove(commentId: string) {
    toastConfirm("ลบความคิดเห็นนี้?", async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
        if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toastDeleted("ลบความคิดเห็นแล้ว");
        router.refresh();
      } catch (error) {
        toastError(error instanceof Error ? error.message : errors.saveFailed);
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <form onSubmit={submit} className="space-y-2">
          <label className="block text-sm font-bold">
            เพิ่มความคิดเห็น
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="บันทึกความคืบหน้า ปัญหา หรือสิ่งที่ต้องประสาน..."
              required
              maxLength={4000}
            />
          </label>
          <Button type="submit" variant="gold" disabled={loading || !body.trim()}>
            {loading ? "กำลังบันทึก..." : "โพสต์ความคิดเห็น"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-[#667085]">ดูความคิดเห็นได้อย่างเดียว</p>
      )}

      <ul className="space-y-3">
        {comments.length === 0 ? (
          <li className="text-sm text-[#667085]">ยังไม่มีความคิดเห็น</li>
        ) : (
          comments.map((comment) => (
            <li key={comment.id} className="rounded-md border border-[#e7e2d7] bg-[#fbfaf5] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <b className="text-sm text-[#101827]">{comment.author_name}</b>
                  <span className="ml-2 text-[10px] text-[#98a2b3]">{formatThaiDateTimeShort(comment.created_at)}</span>
                </div>
                {(comment.user_id === currentUserId || isAdmin) && canEdit ? (
                  <button
                    type="button"
                    className="text-xs font-bold text-[#b91528] hover:underline"
                    onClick={() => remove(comment.id)}
                    disabled={loading}
                  >
                    ลบ
                  </button>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#475467]">{comment.body}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
