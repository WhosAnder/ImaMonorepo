"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateWarehouseReportMutation,
  useUpdateWarehouseReportMutation,
  useWarehouseReportQuery,
} from "@/hooks/useWarehouseReports";
import { useWarehouseItems } from "@/hooks/useWarehouse";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/Button";
import { SignaturePad } from "@/shared/ui/SignaturePad";
import { ImageUpload } from "@/shared/ui/ImageUpload";
import { WarehouseReportPreview } from "../components/WarehouseReportPreview";
import {
  warehouseReportSchema,
  WarehouseReportFormValues,
} from "../schemas/warehouseReportSchema";
import { Save, Plus, Trash2, Package, Wrench } from "lucide-react";
import { createReport } from "../helpers/create-report";
import { generatePDFReport } from "../helpers/generate-pdf";
import { useAuth } from "@/auth/AuthContext";
import { uploadSignaturesToS3 } from "../helpers/upload-signatures";
import { uploadEvidencesForItem } from "../helpers/upload-evidences";

const SUBSYSTEMS = [
  "EQUIPO DE GUIA/ TRABAJO DE GUIA",
  "VEHICULO",
  "EQUIPO DE PROPULSION",
  "EQUIPO DE CONTROL DE TREN (ATC)",
  "EQUIPO DE COMUNICACION",
  "EQUIPO DE DISTRIBUCION DE POTENCIA DE BAJO VOLTAJE",
  "EQUIPO DE CONTROL CENTRAL Y SCADA",
  "EQUIPO DE ESTACION",
  "EQUIPO DE MANTENIMIENTO",
];

interface NewWarehouseReportPageProps {
  reportId?: string;
}

export const NewWarehouseReportPage: React.FC<NewWarehouseReportPageProps> = ({
  reportId,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const createMutation = useCreateWarehouseReportMutation();
  const updateMutation = useUpdateWarehouseReportMutation();

  const isEditMode = Boolean(reportId);

  // Fetch existing report data when in edit mode
  const { data: existingReport, isLoading: isLoadingReport } =
    useWarehouseReportQuery(reportId || "");

  // Fetch inventory
  const { data: inventoryItems, isLoading: loadingInventory } =
    useWarehouseItems({ status: "active" });
  const herramientasOptions =
    inventoryItems?.filter(
      (i) => i.category?.toLowerCase() === "herramientas",
    ) || [];
  const refaccionesOptions =
    inventoryItems?.filter(
      (i) => i.category?.toLowerCase() === "refacciones",
    ) || [];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseReportFormValues>({
    resolver: zodResolver(warehouseReportSchema) as any,
    defaultValues: {
      subsistema: "",
      fechaHoraEntrega: new Date(
        new Date().getTime() - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16),
      turno: "",
      nombreQuienRecibe: "",
      nombreAlmacenista: user?.name || "",
      herramientas: [],
      refacciones: [],
      observacionesGenerales: "",
    },
  });

  const {
    fields: toolsFields,
    append: appendTool,
    remove: removeTool,
  } = useFieldArray({
    control,
    name: "herramientas",
  });

  const {
    fields: partsFields,
    append: appendPart,
    remove: removePart,
  } = useFieldArray({
    control,
    name: "refacciones",
  });

  // Auto-calculate shift (Hidden logic)
  const fechaHoraEntrega = watch("fechaHoraEntrega");
  useEffect(() => {
    if (fechaHoraEntrega) {
      const hour = new Date(fechaHoraEntrega).getHours();
      let shift = "Nocturno";
      if (hour >= 6 && hour < 14) shift = "Matutino";
      else if (hour >= 14 && hour < 22) shift = "Vespertino";
      setValue("turno", shift);
    }
  }, [fechaHoraEntrega, setValue]);

  // Set Almacenista name from user
  useEffect(() => {
    if (user?.name) {
      setValue("nombreAlmacenista", user.name);
    }
  }, [user, setValue]);

  const onSubmit = async (data: WarehouseReportFormValues) => {
    try {
      // 1. Generate temp ID for S3 paths (before report creation)
      const tempReportId = crypto.randomUUID();

      console.log("📤 Step 1/4: Uploading signatures to S3...");

      // 2. Upload ALL signatures first
      const uploadedSignatures = await uploadSignaturesToS3(
        {
          firmaQuienRecibe: data.firmaQuienRecibe || undefined,
          firmaAlmacenista: data.firmaAlmacenista || undefined,
          firmaQuienEntrega: data.firmaQuienEntrega || undefined,
        },
        tempReportId,
        data.subsistema,
        data.fechaHoraEntrega,
      );

      console.log("✅ Signatures uploaded");
      console.log("📤 Step 2/4: Uploading tool evidences to S3...");

      // 3. Upload evidences from herramientas
      const uploadedHerramientas = await Promise.all(
        (data.herramientas || []).map(async (tool) => {
          const uploadedEvidences = await uploadEvidencesForItem(
            tool.evidences || [],
            tempReportId,
            data.subsistema,
            "warehouse",
          );
          return {
            ...tool,
            evidences: uploadedEvidences,
          };
        }),
      );

      console.log("✅ Tool evidences uploaded");
      console.log("📤 Step 3/4: Uploading part evidences to S3...");

      // 4. Upload evidences from refacciones
      const uploadedRefacciones = await Promise.all(
        (data.refacciones || []).map(async (part) => {
          const uploadedEvidences = await uploadEvidencesForItem(
            part.evidences || [],
            tempReportId,
            data.subsistema,
            "warehouse",
          );
          return {
            ...part,
            evidences: uploadedEvidences,
          };
        }),
      );

      console.log("✅ Part evidences uploaded");
      console.log("📤 Step 4/4: Creating warehouse report...");

      // 5. Create clean report data with S3 URLs only (no base64)
      const cleanData = {
        ...data,
        firmaQuienRecibe: uploadedSignatures.firmaQuienRecibe || "",
        firmaAlmacenista: uploadedSignatures.firmaAlmacenista || "",
        firmaQuienEntrega: uploadedSignatures.firmaQuienEntrega || "",
        herramientas: uploadedHerramientas,
        refacciones: uploadedRefacciones,
      };

      // 6. Create report (lightweight, all images in S3)
      const { data: report, error } = await createReport(cleanData);

      if (error) {
        throw new Error(error);
      }

      console.log("✅ Report created successfully!");
      alert("Reporte creado exitosamente");

      // Generate PDF
      await generatePDFReport(cleanData);
    } catch (error: any) {
      console.error("❌ Error creating report:", error);
      alert(error.message || "Error al crear el reporte");
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  // Watch values for preview
  const watchedValues = watch();

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Left Column: Form */}
        <div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Subsistema</label>
                  <select {...register("subsistema")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    {SUBSYSTEMS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.subsistema && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.subsistema.message}
                    </p>
                  )}
                </div>
                {/* Hidden Date Field (Auto-set on submit) */}
                <input type="hidden" {...register("fechaHoraEntrega")} />

                {/* Hidden Turno Field (Auto-calculated) */}
                <input type="hidden" {...register("turno")} />

                <div>
                  <label className={labelClass}>
                    Nombre y firma de quien recibe
                  </label>
                  <input
                    type="text"
                    {...register("nombreQuienRecibe")}
                    className={inputClass}
                    placeholder="Nombre completo"
                  />
                  {errors.nombreQuienRecibe && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nombreQuienRecibe.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Controller
                  name="firmaQuienRecibe"
                  control={control}
                  render={({ field }) => (
                    <SignaturePad
                      label="Firma quien recibe"
                      onChange={field.onChange}
                    />
                  )}
                />
                {/* Almacenista Signature Only (Name is auto from user) */}
                <Controller
                  name="firmaAlmacenista"
                  control={control}
                  render={({ field }) => (
                    <SignaturePad
                      label="Firma almacenista"
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Herramientas Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Herramientas que se entregan
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    appendTool({
                      id: crypto.randomUUID(),
                      name: "",
                      units: 1,
                      observations: "",
                      evidences: [],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>

              {toolsFields.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No hay herramientas agregadas
                </p>
              ) : (
                <div className="space-y-4">
                  {toolsFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg relative"
                    >
                      <div className="col-span-5">
                        <label className="text-xs text-gray-500">
                          Herramienta
                        </label>
                        <select
                          {...register(`herramientas.${index}.name`)}
                          className={inputClass}
                        >
                          <option value="">Seleccionar...</option>
                          {herramientasOptions.map((item) => (
                            <option key={item._id} value={item.name}>
                              {item.name} - Stock: {item.quantityOnHand}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">
                          Unidades
                        </label>
                        <input
                          type="number"
                          {...register(`herramientas.${index}.units`, {
                            valueAsNumber: true,
                          })}
                          className={inputClass}
                          min={1}
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-xs text-gray-500">
                          Observaciones
                        </label>
                        <input
                          {...register(`herramientas.${index}.observations`)}
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-center pb-1">
                        <button
                          type="button"
                          onClick={() => removeTool(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="col-span-12">
                        <Controller
                          name={`herramientas.${index}.evidences`}
                          control={control}
                          render={({ field }) => (
                            <ImageUpload
                              label="Evidencias"
                              value={field.value ?? []}
                              onChange={field.onChange}
                              maxFiles={3}
                            />
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Refacciones Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Refacciones que se entregan
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    appendPart({
                      id: crypto.randomUUID(),
                      name: "",
                      units: 1,
                      observations: "",
                      evidences: [],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>

              {partsFields.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No hay refacciones agregadas
                </p>
              ) : (
                <div className="space-y-4">
                  {partsFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg relative"
                    >
                      <div className="col-span-5">
                        <label className="text-xs text-gray-500">
                          Refacción
                        </label>
                        <select
                          {...register(`refacciones.${index}.name`)}
                          className={inputClass}
                        >
                          <option value="">Seleccionar...</option>
                          {refaccionesOptions.map((item) => (
                            <option key={item._id} value={item.name}>
                              {item.name} - Stock: {item.quantityOnHand}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">
                          Unidades
                        </label>
                        <input
                          type="number"
                          {...register(`refacciones.${index}.units`, {
                            valueAsNumber: true,
                          })}
                          className={inputClass}
                          min={1}
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-xs text-gray-500">
                          Observaciones
                        </label>
                        <input
                          {...register(`refacciones.${index}.observations`)}
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-center pb-1">
                        <button
                          type="button"
                          onClick={() => removePart(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="col-span-12">
                        <Controller
                          name={`refacciones.${index}.evidences`}
                          control={control}
                          render={({ field }) => (
                            <ImageUpload
                              label="Evidencias"
                              value={field.value ?? []}
                              onChange={field.onChange}
                              maxFiles={3}
                            />
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones Generales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className={labelClass}>Observaciones Generales</label>
              <textarea
                {...register("observacionesGenerales")}
                rows={3}
                className={inputClass}
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Footer - Cierre */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Nombre y firma de quien entrega
                  </label>
                  <input
                    type="text"
                    {...register("nombreQuienEntrega")}
                    className={inputClass}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="flex items-end">
                  <Controller
                    name="firmaQuienEntrega"
                    control={control}
                    render={({ field }) => (
                      <SignaturePad
                        label="Firma quien entrega"
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="hidden ">
              <Button
                type="submit"
                isLoading={isSubmitting || updateMutation.isPending}
                className="px-8 py-3"
              >
                <Save className="w-5 h-5 mr-2" />
                {isEditMode ? "Actualizar Reporte" : "Generar Reporte"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <div id="warehouse-report-preview-content">
              <WarehouseReportPreview values={watchedValues} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
