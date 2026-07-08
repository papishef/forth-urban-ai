import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { adminPropertyInputSchema, type AdminPropertyInput } from "@forth-urban/validation";
import { Badge, Button, BuildingLoader, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@forth-urban/ui";
import type { PropertyDTO } from "@forth-urban/shared-types";
import { AlertTriangle, CheckCircle2, Eye, FileText, ImagePlus, Loader2, Pencil, Plus, ShieldCheck, ShieldOff, Sparkles, Trash2, X } from "lucide-react";
import { getErrorMessage } from "../../lib/api-error";
import {
  useAdminCreateProperty,
  useAdminDeleteProperty,
  useAdminDeletePropertyMedia,
  useAdminProperties,
  useAdminUpdateProperty,
  useAdminUploadPropertyMedia,
  useVerifyPassword,
} from "./admin-api";
import { AdminLayout } from "./admin-layout";
import { PasswordConfirmModal } from "./password-confirm-modal";

/** Read-only "view" modal for a property — shows its full details plus every attached photo/video/document. */
function PropertyViewModal({ property, onClose }: { property: PropertyDTO; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181818]/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/50 bg-white/95 p-6 shadow-2xl shadow-[#5C4033]/20 backdrop-blur-md"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-[#181818]">{property.name}</h2>
            <p className="text-sm text-[#181818]/60">{property.estateName}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" className="shrink-0 px-2.5" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <Badge variant="premium">{property.isActive ? "Active" : "Inactive"}</Badge>
          <Badge variant="premium">{property.developmentStatus}</Badge>
          {property.features.map((feature) => (
            <Badge key={feature} variant="premium">
              <Sparkles className="h-3 w-3" />
              {feature}
            </Badge>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-[#181818]/50">Address</dt>
            <dd className="text-[#181818]">{property.location.address}</dd>
          </div>
          <div>
            <dt className="text-[#181818]/50">Price per plot</dt>
            <dd className="text-[#181818]">₦{property.pricePerPlot.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-[#181818]/50">Title type</dt>
            <dd className="text-[#181818]">{property.titleType}</dd>
          </div>
          <div>
            <dt className="text-[#181818]/50">Documentation status</dt>
            <dd className="text-[#181818]">{property.documentationStatus}</dd>
          </div>
          {property.plotSizes.length > 0 && (
            <div className="col-span-2">
              <dt className="text-[#181818]/50">Plot sizes</dt>
              <dd className="text-[#181818]">{property.plotSizes.join(", ")}</dd>
            </div>
          )}
        </dl>

        {property.description && (
          <p className="mt-4 text-sm text-[#181818]/70">{property.description}</p>
        )}

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-medium text-[#181818]">Photos {property.media.photos.length > 0 && `(${property.media.photos.length})`}</h3>
          {property.media.photos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {property.media.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${property.name} photo ${i + 1}`}
                  className="h-24 w-24 rounded-lg border border-white/50 object-cover shadow-sm"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#181818]/50">No photos uploaded yet.</p>
          )}
        </div>

        {property.media.videos.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-medium text-[#181818]">Videos</h3>
            <div className="flex flex-col gap-1.5">
              {property.media.videos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#5C4033] underline underline-offset-2"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Video {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {(property.media.brochureUrl || property.media.titleDocuments.length > 0) && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-medium text-[#181818]">Documents</h3>
            <div className="flex flex-col gap-1.5">
              {property.media.brochureUrl && (
                <a
                  href={property.media.brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#5C4033] underline underline-offset-2"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Brochure
                </a>
              )}
              {property.media.titleDocuments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#5C4033] underline underline-offset-2"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Title document {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

type PendingPropertyAction =
  | { type: "edit"; property: PropertyDTO; payload: AdminPropertyInput }
  | { type: "toggleActive"; property: PropertyDTO }
  | { type: "delete"; property: PropertyDTO };

const EMPTY_PROPERTY: AdminPropertyInput = {
  name: "",
  estateName: "",
  location: { address: "", landmarks: [], lat: null, lng: null },
  pricePerPlot: 0,
  plotSizes: [],
  titleType: "",
  documentationStatus: "",
  paymentPlans: [],
  bestFitBuyerTypes: [],
  developmentStatus: "developing",
  inspectionAvailability: { physical: true, virtual: true },
  hiddenCostRules: [],
  roiAssumptions: { conservative: 0.05, moderate: 0.1, optimistic: 0.15 },
  media: { photos: [], videos: [], googleMapsUrl: null, brochureUrl: null, titleDocuments: [] },
  features: [],
  description: null,
  isActive: true,
};

interface StagedPhoto {
  file: File;
  previewUrl: string;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
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

/**
 * Phase 7 admin Properties CRUD. The create/edit panel doubles as the media
 * upload flow — photos staged here upload right after the property is
 * created/updated, so admins never have to leave the panel to add images.
 */
export function AdminPropertiesPage() {
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [editingProperty, setEditingProperty] = React.useState<PropertyDTO | null>(null);
  const [featureInputs, setFeatureInputs] = React.useState<string[]>([""]);
  const [stagedPhotos, setStagedPhotos] = React.useState<StagedPhoto[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [viewingProperty, setViewingProperty] = React.useState<PropertyDTO | null>(null);
  const [pendingAction, setPendingAction] = React.useState<PendingPropertyAction | null>(null);
  const [toast, setToast] = React.useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = React.useState<string | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = React.useCallback((message: string, variant: "success" | "error" = "success") => {
    setToast({ message, variant });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), variant === "error" ? 6000 : 3500);
  }, []);

  React.useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const { data, isLoading } = useAdminProperties(page);
  const createProperty = useAdminCreateProperty();
  const updateProperty = useAdminUpdateProperty();
  const deleteProperty = useAdminDeleteProperty();
  const uploadMedia = useAdminUploadPropertyMedia();
  const deleteMedia = useAdminDeletePropertyMedia();
  const verifyPassword = useVerifyPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminPropertyInput>({
    resolver: zodResolver(adminPropertyInputSchema),
    defaultValues: EMPTY_PROPERTY,
  });

  const openCreateForm = () => {
    setEditingProperty(null);
    reset(EMPTY_PROPERTY);
    setFeatureInputs([""]);
    setStagedPhotos([]);
    setShowForm(true);
  };

  const openEditForm = (property: PropertyDTO) => {
    setEditingProperty(property);
    reset({
      name: property.name,
      estateName: property.estateName,
      location: property.location,
      pricePerPlot: property.pricePerPlot,
      plotSizes: property.plotSizes,
      titleType: property.titleType,
      documentationStatus: property.documentationStatus,
      paymentPlans: property.paymentPlans,
      bestFitBuyerTypes: property.bestFitBuyerTypes as AdminPropertyInput["bestFitBuyerTypes"],
      developmentStatus: property.developmentStatus,
      inspectionAvailability: property.inspectionAvailability,
      hiddenCostRules: property.hiddenCostRules,
      roiAssumptions: property.roiAssumptions,
      media: property.media,
      features: property.features,
      description: property.description,
      isActive: property.isActive,
    });
    setFeatureInputs(property.features.length > 0 ? property.features : [""]);
    setStagedPhotos([]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProperty(null);
    reset(EMPTY_PROPERTY);
    setFeatureInputs([""]);
    stagedPhotos.forEach((staged) => URL.revokeObjectURL(staged.previewUrl));
    setStagedPhotos([]);
  };

  const handleStagePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newPhotos = Array.from(e.target.files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setStagedPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  };

  const removeStagedPhoto = (index: number) => {
    setStagedPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Deletes an already-uploaded photo from Cloudinary storage and the
  // property doc in one call, then syncs the local `editingProperty` copy so
  // the thumbnail disappears immediately (the panel's list of existing
  // photos reads from this state, not the refetched query).
  const removeExistingPhoto = async (url: string) => {
    if (!editingProperty) return;
    setDeletingPhotoUrl(url);
    try {
      const updated = await deleteMedia.mutateAsync({ id: editingProperty.id, input: { field: "photos", url } });
      setEditingProperty(updated);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete photo"), "error");
    } finally {
      setDeletingPhotoUrl(null);
    }
  };

  const updateFeatureField = (index: number, value: string) => {
    setFeatureInputs((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const addFeatureField = () => {
    setFeatureInputs((prev) => [...prev, ""]);
  };

  const removeFeatureField = (index: number) => {
    setFeatureInputs((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // Uploads a fixed snapshot of staged photos (passed explicitly rather than
  // read from state) so a failure here can never be confused with photos
  // staged for a *later* submission once the form/state has moved on.
  const uploadStagedPhotosFor = async (propertyId: string, photos: StagedPhoto[]) => {
    for (const staged of photos) {
      const base64Data = await readFileAsBase64(staged.file);
      await uploadMedia.mutateAsync({
        id: propertyId,
        input: { kind: "image", field: "photos", mimeType: staged.file.type, base64Data },
      });
    }
  };

  // Attempts the photo upload but never lets it hide/replace the success
  // toast for the property save itself — the property row is already
  // persisted at this point regardless of whether its photos attach.
  const uploadStagedPhotosSafely = async (propertyId: string, photos: StagedPhoto[]) => {
    if (photos.length === 0) return;
    try {
      await uploadStagedPhotosFor(propertyId, photos);
    } catch (err) {
      showToast(getErrorMessage(err, "Property saved, but the photo upload failed. Edit the property to retry."), "error");
    } finally {
      photos.forEach((staged) => URL.revokeObjectURL(staged.previewUrl));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: AdminPropertyInput = {
      ...values,
      features: featureInputs.map((f) => f.trim()).filter(Boolean),
      description: values.description?.trim() ? values.description.trim() : null,
    };

    // Editing an existing property is a sensitive change — gate it behind the
    // same password re-auth as deactivate/delete before it's actually saved.
    if (editingProperty) {
      setPendingAction({ type: "edit", property: editingProperty, payload });
      return;
    }

    setIsSaving(true);
    try {
      const savedProperty = await createProperty.mutateAsync(payload);
      showToast("Property added successfully");

      // Keep the modal open for rapid back-to-back entry, but clear the
      // inputs so the admin doesn't accidentally resubmit the same property.
      const photosToUpload = stagedPhotos;
      reset(EMPTY_PROPERTY);
      setFeatureInputs([""]);
      setStagedPhotos([]);

      await uploadStagedPhotosSafely(savedProperty.id, photosToUpload);
    } finally {
      setIsSaving(false);
    }
  });

  const handleConfirmPendingAction = async (password: string) => {
    if (!pendingAction) return;
    await verifyPassword.mutateAsync(password);

    if (pendingAction.type === "edit") {
      setIsSaving(true);
      try {
        const savedProperty = await updateProperty.mutateAsync({
          id: pendingAction.property.id,
          input: pendingAction.payload,
        });
        showToast("Property updated successfully");

        const photosToUpload = stagedPhotos;
        setStagedPhotos([]);
        await uploadStagedPhotosSafely(savedProperty.id, photosToUpload);

        closeForm();
      } finally {
        setIsSaving(false);
      }
    } else if (pendingAction.type === "toggleActive") {
      await updateProperty.mutateAsync({
        id: pendingAction.property.id,
        input: { isActive: !pendingAction.property.isActive },
      });
      showToast(pendingAction.property.isActive ? "Property deactivated" : "Property activated");
    } else {
      await deleteProperty.mutateAsync(pendingAction.property.id);
      showToast("Property deleted");
    }

    setPendingAction(null);
  };

  const isBusy = isSubmitting || isSaving;

  return (
    <AdminLayout title="Properties">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => (showForm ? closeForm() : openCreateForm())}>
          {showForm ? "Cancel" : "Add property"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingProperty ? `Edit ${editingProperty.name}` : "New property"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-2 gap-4" onSubmit={onSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="estateName">Estate name</Label>
                <Input id="estateName" {...register("estateName")} />
                {errors.estateName && <p className="text-sm text-red-600">{errors.estateName.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("location.address")} />
                {errors.location?.address && <p className="text-sm text-red-600">{errors.location.address.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pricePerPlot">Price per plot (₦)</Label>
                <Input id="pricePerPlot" type="number" {...register("pricePerPlot", { valueAsNumber: true })} />
                {errors.pricePerPlot && <p className="text-sm text-red-600">{errors.pricePerPlot.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="titleType">Title type</Label>
                <Input id="titleType" {...register("titleType")} />
                {errors.titleType && <p className="text-sm text-red-600">{errors.titleType.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="documentationStatus">Documentation status</Label>
                <Input id="documentationStatus" {...register("documentationStatus")} />
                {errors.documentationStatus && (
                  <p className="text-sm text-red-600">{errors.documentationStatus.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="developmentStatus">Development status</Label>
                <select
                  id="developmentStatus"
                  className="rounded-md border border-[#181818]/20 bg-white px-3 py-2 text-sm"
                  {...register("developmentStatus")}
                >
                  <option value="serviced">Serviced</option>
                  <option value="developing">Developing</option>
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Features</Label>
                <p className="text-xs text-[#181818]/50">
                  Short highlight tags shown as premium pills on the property page (e.g. "Gated estate", "C of O
                  ready").
                </p>
                <div className="flex flex-col gap-2">
                  {featureInputs.map((feature, index) => {
                    const isLast = index === featureInputs.length - 1;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          placeholder="e.g. Gated estate"
                          onChange={(e) => updateFeatureField(index, e.target.value)}
                        />
                        {featureInputs.length > 1 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0 px-2.5"
                            aria-label="Remove feature"
                            onClick={() => removeFeatureField(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {isLast && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0 px-2.5"
                            aria-label="Add feature"
                            onClick={addFeatureField}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Any other details worth sharing about this property…"
                  {...register("description")}
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Photos</Label>
                {editingProperty && editingProperty.media.photos.length > 0 && (
                  <div className="mb-1 flex flex-wrap gap-2">
                    {editingProperty.media.photos.map((url, i) => {
                      const isDeleting = deletingPhotoUrl === url;
                      return (
                        <div key={i} className="group relative">
                          <img
                            src={url}
                            alt="Existing property"
                            className={`h-14 w-14 rounded-lg border border-white/50 object-cover shadow-sm transition ${
                              isDeleting ? "opacity-40" : ""
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingPhoto(url)}
                            disabled={isDeleting}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#181818] text-white shadow-sm transition hover:bg-red-600 disabled:pointer-events-none"
                            aria-label="Delete photo"
                          >
                            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="relative h-11 w-full sm:w-64">
                  <Button
                    type="button"
                    variant="secondary"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Add photos
                  </Button>
                  {/*
                    Plain native <input> on purpose: the shared `Input`
                    component wraps its element in its own unsized
                    `motion.div`, which collapses to 0×0 (no in-flow
                    content) and silently swallows clicks on this
                    absolutely-positioned file trigger.
                  */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleStagePhotos}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                {stagedPhotos.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {stagedPhotos.map((staged, i) => (
                      <div key={i} className="group relative">
                        <img
                          src={staged.previewUrl}
                          alt="Pending upload"
                          className="h-14 w-14 rounded-lg border border-[#5C4033]/30 object-cover shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeStagedPhoto(i)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#181818] text-white shadow-sm transition hover:bg-red-600"
                          aria-label="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isBusy} isLoading={isBusy}>
                  {editingProperty ? "Save changes" : "Create property"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{data ? `${data.total} properties` : "Properties"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && <BuildingLoader size="sm" label="Loading…" className="py-6" />}
          {data?.items.map((property) => (
            <div
              key={property.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#181818]/10 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-[#181818]">{property.name}</p>
                <p className="mb-2 text-[#181818]/60">
                  {property.location.address} · ₦{property.pricePerPlot.toLocaleString()}
                </p>
                {property.features.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {property.features.map((feature) => (
                      <Badge key={feature} variant="premium">
                        <Sparkles className="h-3 w-3" />
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
                {property.media && property.media.photos.length > 0 && (
                  <div className="mt-2 flex max-w-sm flex-wrap gap-2">
                    {property.media.photos.map((url, i) => (
                      <img key={i} src={url} alt="upload preview" className="h-12 w-12 rounded border border-white/20 object-cover shadow-sm" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <Button variant="secondary" onClick={() => setViewingProperty(property)}>
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button variant="secondary" onClick={() => openEditForm(property)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPendingAction({ type: "toggleActive", property })}
                >
                  {property.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {property.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="secondary" onClick={() => setPendingAction({ type: "delete", property })}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {data && (
        <div className="mt-4 flex items-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-[#181818]/60">
            Page {data.page} of {Math.max(1, Math.ceil(data.total / data.limit))}
          </span>
          <Button
            variant="secondary"
            disabled={page * data.limit >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <AnimatePresence>
        {viewingProperty && (
          <PropertyViewModal property={viewingProperty} onClose={() => setViewingProperty(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAction && (
          <PasswordConfirmModal
            title={
              pendingAction.type === "edit"
                ? "Confirm property changes"
                : pendingAction.type === "delete"
                  ? "Confirm property deletion"
                  : "Confirm status change"
            }
            confirmLabel={
              pendingAction.type === "edit" ? "Save changes" : pendingAction.type === "delete" ? "Delete property" : "Confirm"
            }
            description={
              pendingAction.type === "edit" ? (
                <>
                  You&apos;re saving changes to{" "}
                  <span className="font-medium text-[#181818]">{pendingAction.property.name}</span>. Enter your
                  password to confirm.
                </>
              ) : pendingAction.type === "delete" ? (
                <>
                  You&apos;re permanently deleting{" "}
                  <span className="font-medium text-[#181818]">{pendingAction.property.name}</span>. This cannot be
                  undone. Enter your password to confirm.
                </>
              ) : (
                <>
                  You&apos;re {pendingAction.property.isActive ? "deactivating" : "activating"}{" "}
                  <span className="font-medium text-[#181818]">{pendingAction.property.name}</span>. Enter your
                  password to confirm.
                </>
              )
            }
            onCancel={() => setPendingAction(null)}
            onConfirm={handleConfirmPendingAction}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed right-6 top-6 z-50 flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl ${
              toast.variant === "error"
                ? "border-red-400/30 bg-red-600 text-white shadow-red-900/30"
                : "border-white/10 bg-[#181818] text-white shadow-[#5C4033]/30"
            }`}
          >
            {toast.variant === "error" ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-white" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
