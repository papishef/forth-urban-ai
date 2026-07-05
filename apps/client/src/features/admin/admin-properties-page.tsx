import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminPropertyInputSchema, type AdminPropertyInput } from "@forth-urban/validation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@forth-urban/ui";
import { useAdminCreateProperty, useAdminDeleteProperty, useAdminProperties, useAdminUpdateProperty } from "./admin-api";
import { AdminLayout } from "./admin-layout";

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
  isActive: true,
};

/** Phase 7 admin Properties CRUD — full media/payment-plan editing is deliberately kept minimal (core fields only) for launch. */
export function AdminPropertiesPage() {
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const { data, isLoading } = useAdminProperties(page);
  const createProperty = useAdminCreateProperty();
  const updateProperty = useAdminUpdateProperty();
  const deleteProperty = useAdminDeleteProperty();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminPropertyInput>({
    resolver: zodResolver(adminPropertyInputSchema),
    defaultValues: EMPTY_PROPERTY,
  });

  const onSubmit = handleSubmit(async (values) => {
    await createProperty.mutateAsync(values);
    reset(EMPTY_PROPERTY);
    setShowForm(false);
  });

  return (
    <AdminLayout title="Properties">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Add property"}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New property</CardTitle>
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
              <div className="col-span-2 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Create property"}
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
          {isLoading && <p className="text-sm text-[#181818]/60">Loading…</p>}
          {data?.items.map((property) => (
            <div
              key={property.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#181818]/10 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-[#181818]">{property.name}</p>
                <p className="text-[#181818]/60">
                  {property.location.address} · ₦{property.pricePerPlot.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateProperty.mutate({ id: property.id, input: { isActive: !property.isActive } })
                  }
                >
                  {property.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="secondary" onClick={() => deleteProperty.mutate(property.id)}>
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
    </AdminLayout>
  );
}
