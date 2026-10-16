import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminBlogPostInputSchema,
  type AdminBlogPostInput,
} from "@forth-urban/validation";
import type { BlogPostDTO } from "@forth-urban/shared-types";
import {
  Plus,
  Send,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  UploadCloud,
  ImagePlus,
  X,
  Tag,
  BookOpen,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Label,
  BuildingLoader,
  StorageMeter,
} from "@forth-urban/ui";
import { AdminLayout } from "./admin-layout";
import {
  useAdminBlogPosts,
  useAdminCreateBlogPost,
  useAdminUpdateBlogPost,
  useAdminDeleteBlogPost,
  useAdminPublishBlogPost,
  useAdminUploadBlogMedia,
  useAdminDeleteBlogMedia,
  useAdminStorageStatus,
} from "./admin-api";
import { MarkdownRenderer } from "../../components/markdown-renderer";
import { canWriteAdminMenu } from "../../lib/admin-access";
import { useAuth } from "../../lib/auth-context";
import { getErrorMessage } from "../../lib/api-error";
import { StoragePricingModal } from "./storage-pricing-modal";

interface StagedCover {
  file: File;
  previewUrl: string;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1];
      if (!base64Data) {
        reject(new Error("Could not read file"));
        return;
      }
      resolve(base64Data);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function AdminBlogPage() {
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPostDTO | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [publishModalPost, setPublishModalPost] = useState<BlogPostDTO | null>(null);
  const [sendNewsletterOnPublish, setSendNewsletterOnPublish] = useState(true);
  const [stagedCover, setStagedCover] = useState<StagedCover | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [showStoragePricing, setShowStoragePricing] = useState(false);

  const { data, isLoading } = useAdminBlogPosts(page, statusFilter);
  const storage = useAdminStorageStatus();
  const createMutation = useAdminCreateBlogPost();
  const updateMutation = useAdminUpdateBlogPost();
  const deleteMutation = useAdminDeleteBlogPost();
  const publishMutation = useAdminPublishBlogPost();
  const uploadMediaMutation = useAdminUploadBlogMedia();
  const deleteMediaMutation = useAdminDeleteBlogMedia();
  const { user } = useAuth();
  const canWrite = canWriteAdminMenu(user, "blog");
  const canManageStorage = canWriteAdminMenu(user, "settings");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminBlogPostInput>({
    resolver: zodResolver(adminBlogPostInputSchema),
    defaultValues: {
      category: "Market Insights",
      status: "draft",
      tags: [],
    },
  });

  const bodyMarkdownValue = watch("bodyMarkdown") || "";

  const clearStagedCover = () => {
    setStagedCover((previous) => {
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return null;
    });
  };

  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setSelectedPost(null);
    clearStagedCover();
    setCoverUploadError(null);
  };

  const openCreate = () => {
    clearStagedCover();
    setCoverUploadError(null);
    setSelectedPost(null);
    reset({
      title: "",
      slug: "",
      excerpt: "",
      bodyMarkdown: "",
      coverImageUrl: null,
      category: "Market Insights",
      tags: [],
      status: "draft",
      seoTitle: null,
      seoDescription: null,
    });
    setIsEditing(true);
    setShowPreview(false);
  };

  const openEdit = (post: BlogPostDTO) => {
    clearStagedCover();
    setCoverUploadError(null);
    setSelectedPost(post);
    reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      bodyMarkdown: post.bodyMarkdown,
      coverImageUrl: post.coverImageUrl,
      category: post.category,
      tags: post.tags,
      status: post.status,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    });
    setIsEditing(true);
    setShowPreview(false);
  };

  const onSave = handleSubmit(async (formData) => {
    if (!canWrite) return;
    setCoverUploadError(null);
    let savedPost: BlogPostDTO;
    if (selectedPost) {
      savedPost = await updateMutation.mutateAsync({
        id: selectedPost.id,
        input: { ...formData, coverImageUrl: selectedPost.coverImageUrl },
      });
    } else {
      savedPost = await createMutation.mutateAsync({ ...formData, coverImageUrl: null });
    }

    if (stagedCover) {
      try {
        const base64Data = await readFileAsBase64(stagedCover.file);
        savedPost = await uploadMediaMutation.mutateAsync({
          id: savedPost.id,
          input: { mimeType: stagedCover.file.type, base64Data },
        });
        setValue("coverImageUrl", savedPost.coverImageUrl);
        clearStagedCover();
      } catch (err) {
        setSelectedPost(savedPost);
        setValue("coverImageUrl", savedPost.coverImageUrl);
        setCoverUploadError(getErrorMessage(err, "Article saved, but the cover image upload failed. Choose the file again to retry."));
        return;
      }
    }
    setIsEditing(false);
    setSelectedPost(null);
  });

  const handleDelete = async (id: string) => {
    if (!canWrite) return;
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishModalPost || !canWrite) return;
    await publishMutation.mutateAsync({
      id: publishModalPost.id,
      input: { sendNewsletter: sendNewsletterOnPublish },
    });
    setPublishModalPost(null);
  };

  const handleStageCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canWrite) return;
    if (!file.type.startsWith("image/")) {
      setCoverUploadError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    setCoverUploadError(null);
    setStagedCover((previous) => {
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
    e.target.value = "";
  };

  const handleRemoveCover = async () => {
    if (!selectedPost?.coverImageUrl || !canWrite) return;
    try {
      const updated = await deleteMediaMutation.mutateAsync({
        id: selectedPost.id,
        input: { url: selectedPost.coverImageUrl },
      });
      setSelectedPost(updated);
      setValue("coverImageUrl", null);
    } catch (err) {
      setCoverUploadError(getErrorMessage(err, "Cover image could not be removed."));
    }
  };

  return (
    <AdminLayout title="Blog & Insights Management">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#181818]">
              Blog Articles
            </h2>
            <p className="text-sm text-[#181818]/60">
              Create, edit, and publish real estate guides and market reports.
            </p>
          </div>
          {!isEditing && canWrite && (
            <Button
              variant="primary"
              size="md"
              onClick={openCreate}
              className="gap-2 !bg-[#5C4033] shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Article</span>
            </Button>
          )}
        </div>

        {/* Editor Modal / Inline Form */}
        {isEditing && canWrite ? (
          <Card className="border-[#5C4033]/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#181818]/10 pb-4">
              <CardTitle>
                {selectedPost ? "Edit Article" : "Create New Article"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPreview((p) => !p)}
                  className="gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{showPreview ? "Back to Editor" : "Live Preview"}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeEditor}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {showPreview ? (
                <div className="space-y-6 max-w-3xl mx-auto py-4">
                  <div className="rounded-2xl bg-white p-6 border border-[#181818]/10">
                    <h1 className="font-heading text-3xl font-bold text-[#181818] mb-4">
                      {watch("title") || "Article Title"}
                    </h1>
                    <p className="text-sm text-[#181818]/70 italic mb-6">
                      {watch("excerpt") || "Article excerpt preview..."}
                    </p>
                    <MarkdownRenderer content={bodyMarkdownValue} />
                  </div>
                </div>
              ) : (
                <form onSubmit={onSave} noValidate className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Article Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g. 5 Critical Checks for Abuja Land Titles"
                        {...register("title")}
                      />
                      {errors.title && (
                        <p className="text-xs text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        className="h-11 w-full rounded-xl border border-[#181818]/20 bg-white px-3 text-sm"
                        {...register("category")}
                      >
                        <option value="Market Insights">Market Insights</option>
                        <option value="Investment Guides">Investment Guides</option>
                        <option value="Legal & Due Diligence">Legal & Due Diligence</option>
                        <option value="Company News">Company News</option>
                        <option value="Area Spotlights">Area Spotlights</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="slug">Custom Slug (Optional)</Label>
                      <Input
                        id="slug"
                        placeholder="auto-generated-from-title"
                        {...register("slug")}
                      />
                      {errors.slug && (
                        <p className="text-xs text-red-600">{errors.slug.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Cover image</Label>
                      <div className="rounded-2xl border border-dashed border-[#5C4033]/25 bg-white/55 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-[#5C4033]/10 bg-[#FFECE4]/60 sm:w-36">
                            {stagedCover ? (
                              <img src={stagedCover.previewUrl} alt="Selected cover preview" className="h-full w-full object-cover" />
                            ) : watch("coverImageUrl") ? (
                              <img src={watch("coverImageUrl") ?? undefined} alt="Current cover" className="h-full w-full object-cover" />
                            ) : (
                              <ImagePlus className="h-7 w-7 text-[#5C4033]/35" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#181818]">Add a visual cover</p>
                            <p className="mt-1 text-xs leading-relaxed text-[#181818]/55">JPG, PNG, or WebP. The image is uploaded securely after you save the article.</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#5C4033]/25 bg-white px-3 py-2 text-xs font-semibold text-[#5C4033] transition hover:bg-[#5C4033]/5">
                                <UploadCloud className="h-4 w-4" />
                                <span>{stagedCover || watch("coverImageUrl") ? "Replace image" : "Choose image"}</span>
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleStageCover} />
                              </label>
                              {selectedPost?.coverImageUrl && !stagedCover && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => void handleRemoveCover()} disabled={deleteMediaMutation.isPending} className="gap-1.5 text-red-700">
                                  <X className="h-3.5 w-3.5" />
                                  Remove
                                </Button>
                              )}
                              {stagedCover && (
                                <Button type="button" variant="ghost" size="sm" onClick={clearStagedCover} className="gap-1.5">
                                  <X className="h-3.5 w-3.5" />
                                  Clear selection
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {coverUploadError && <p className="mt-3 text-xs font-medium text-red-700">{coverUploadError}</p>}
                        {storage.data && <StorageMeter status={storage.data} compact onUpgrade={canManageStorage ? () => setShowStoragePricing(true) : undefined} className="mt-3" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="excerpt">Lead Excerpt (Summary) *</Label>
                    <Textarea
                      id="excerpt"
                      rows={2}
                      placeholder="Short 2-3 sentence overview displayed on article cards and newsletter previews..."
                      {...register("excerpt")}
                    />
                    {errors.excerpt && (
                      <p className="text-xs text-red-600">{errors.excerpt.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bodyMarkdown">Article Content (Markdown) *</Label>
                      <span className="text-xs text-[#181818]/60">
                        Supports # Headings, **bold**, - lists, and [links](url)
                      </span>
                    </div>
                    <Textarea
                      id="bodyMarkdown"
                      rows={12}
                      className="font-mono text-sm leading-relaxed"
                      placeholder="# Main Heading&#10;&#10;Write your article here..."
                      {...register("bodyMarkdown")}
                    />
                    {errors.bodyMarkdown && (
                      <p className="text-xs text-red-600">{errors.bodyMarkdown.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#181818]/10">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={closeEditor}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="!bg-[#5C4033]"
                    >
                      {isSubmitting ? "Saving..." : "Save Article"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Articles List Table */
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <CardTitle>All Articles</CardTitle>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFilterChange(undefined)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      statusFilter === undefined
                        ? "bg-[#5C4033] text-white"
                        : "bg-white text-[#181818]/70 border border-[#181818]/10"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange("published")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      statusFilter === "published"
                        ? "bg-[#5C4033] text-white"
                        : "bg-white text-[#181818]/70 border border-[#181818]/10"
                    }`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange("draft")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      statusFilter === "draft"
                        ? "bg-[#5C4033] text-white"
                        : "bg-white text-[#181818]/70 border border-[#181818]/10"
                    }`}
                  >
                    Drafts
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading && <BuildingLoader size="sm" label="Loading articles…" className="py-8" />}

              {data && data.items.length === 0 && (
                <div className="py-12 text-center">
                  <BookOpen className="h-10 w-10 text-[#5C4033]/40 mx-auto mb-2" />
                  <p className="text-sm text-[#181818]/60">No articles found.</p>
                </div>
              )}

              {data && data.items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#181818]/10 text-xs font-semibold text-[#181818]/60 uppercase">
                        <th className="py-3 px-2">Title</th>
                        <th className="py-3 px-2">Category</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Newsletter</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((post) => (
                        <tr
                          key={post.id}
                          className="border-b border-[#181818]/5 hover:bg-white/50 transition"
                        >
                          <td className="py-3.5 px-2 max-w-xs">
                            <div className="font-semibold text-[#181818] truncate">
                              {post.title}
                            </div>
                            <div className="text-xs text-[#181818]/50 truncate">
                              /blog/{post.slug}
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="inline-flex items-center gap-1 text-xs text-[#5C4033] bg-[#FFECE4] px-2.5 py-0.5 rounded-full font-medium">
                              <Tag className="h-2.5 w-2.5" />
                              {post.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                post.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {post.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-xs">
                            {post.newsletterSentAt ? (
                              <span className="text-green-700 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                              </span>
                            ) : (
                              <span className="text-[#181818]/40">Not Sent</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-right space-x-1">
                            {canWrite && post.status === "draft" && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setPublishModalPost(post)}
                                className="!bg-emerald-700 hover:!bg-emerald-800 h-8 px-2.5 text-xs gap-1"
                              >
                                <Send className="h-3 w-3" />
                                <span>Publish</span>
                              </Button>
                            )}
                            {canWrite && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openEdit(post)}
                                  className="h-8 px-2.5 text-xs gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(post.id)}
                                  className="h-8 px-2 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {data && data.total > PAGE_SIZE && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-xs font-semibold text-[#181818]/70">
                    Page {data.page} of {Math.ceil(data.total / PAGE_SIZE)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page * PAGE_SIZE >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Publish Confirmation Modal */}
        {publishModalPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="font-heading text-lg font-bold text-[#181818]">
                Publish Article: {publishModalPost.title}
              </h3>
              <p className="text-sm text-[#181818]/70">
                This will make the article visible on the public website.
              </p>

              <div className="rounded-2xl bg-[#FFECE4]/70 p-4 border border-[#5C4033]/20 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendNewsletterOnPublish}
                    onChange={(e) => setSendNewsletterOnPublish(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded text-[#5C4033] focus:ring-[#5C4033]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#5C4033] block">
                      Send Newsletter Campaign to Subscribers
                    </span>
                    <span className="text-xs text-[#181818]/70 block">
                      Dispatches an email with post excerpt and cover image to all confirmed subscribers.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPublishModalPost(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePublishConfirm}
                  className="!bg-emerald-700 gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Confirm & Publish</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        <StoragePricingModal open={showStoragePricing} onClose={() => setShowStoragePricing(false)} status={storage.data} />
      </div>
    </AdminLayout>
  );
}
