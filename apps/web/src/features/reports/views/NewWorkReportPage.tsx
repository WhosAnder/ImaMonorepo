"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useTemplateFilters,
  useActivitiesBySubsystemAndFrequency,
} from "@/hooks/useTemplates";
import {
  useCreateWorkReportMutation,
  useUpdateWorkReportMutation,
  useWorkReportQuery,
} from "@/hooks/useWorkReports";
import { useWarehouseItems } from "@/hooks/useWarehouse";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useWorkers } from "@/hooks/useWorkers";
import { zodResolver } from "@hookform/resolvers/zod";

// shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
// Simple Card component to match almacen/new UX
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`w-full rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm ${className}`}
  >
    {children}
  </div>
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Custom components
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { SignaturePad } from "@/shared/ui/SignaturePad";
import { ImageUpload, LocalEvidence } from "@/shared/ui/ImageUpload";
import {
  workReportSchema,
  WorkReportFormValues,
} from "../schemas/workReportSchema";
import { Save, Plus, Trash2, Wrench } from "lucide-react";
import { Template } from "@/types/template";
import { WorkReportPreview } from "../components/WorkReportPreview";
import { useAuth } from "@/auth/AuthContext";
import type { WarehouseItem } from "@/api/warehouseClient";
import { uploadEvidence } from "@/api/evidencesClient";
import { uploadWorkReportSignature } from "../helpers/upload-signature";

const WORK_REPORT_DRAFT_KEY = "work_report_draft";

interface ActivityWithDetails {
  id: string;
  name: string;
  code?: string;
  template: Template;
  isSelected: boolean;
  observaciones: string;
  evidencias: LocalEvidence[];
  expanded: boolean;
}

const convertSignatureToBase64 = async (
  signatureUrl: string | null,
): Promise<string | null> => {
  if (!signatureUrl) return null;
  if (signatureUrl.startsWith("data:image")) return signatureUrl;

  try {
    const response = await fetch(signatureUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting signature:", error);
    return null;
  }
};

const prepareActivityEvidence = async (activities: any[]) => {
  return activities.map((act) => {
    // LocalEvidence already has base64, so just extract the base64 URLs
    const evidencias =
      act.evidencias?.map((evidence: LocalEvidence | string) => {
        if (typeof evidence === "string") return evidence;
        return evidence.base64 || evidence.previewUrl;
      }) || [];
    return {
      ...act,
      evidencias,
    };
  });
};

interface NewWorkReportPageProps {
  reportId?: string;
}

export const NewWorkReportPage: React.FC<NewWorkReportPageProps> = ({
  reportId,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [activitiesState, setActivitiesState] = useState<ActivityWithDetails[]>(
    [],
  );
  const [draftStatus, setDraftStatus] = useState<"empty" | "loaded">("empty");
  const draftRestorationGuardRef = useRef(false);
  const [customSubsistema, setCustomSubsistema] = useState("");
  const [customFrecuencia, setCustomFrecuencia] = useState("");
  const [customActivities, setCustomActivities] = useState<
    ActivityWithDetails[]
  >([]);

  const isEditMode = Boolean(reportId);

  // Fetch existing report data when in edit mode
  const { data: existingReport, isLoading: isLoadingReport } =
    useWorkReportQuery(reportId || "");

  const initialFormValues = {
    subsistema: "",
    ubicacion: "",
    fechaHoraInicio: new Date().toISOString().slice(0, 16),
    turno: "",
    frecuencia: "",
    trabajadores: [],
    actividadesRealizadas: [],
    herramientas: [],
    refacciones: [],
    nombreResponsable: user?.name || "",
    firmaResponsable: null,
    templateIds: [],
    observacionesGenerales: "",
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkReportFormValues>({
    resolver: zodResolver(workReportSchema) as any,
    defaultValues: initialFormValues as any,
  });

  const fechaHoraInicio = watch("fechaHoraInicio");
  const subsistema = watch("subsistema");
  const frecuencia = watch("frecuencia");

  const { data: filtersData, isLoading: isLoadingFilters } =
    useTemplateFilters("work");
  const subsystems = filtersData?.subsistemas || [];

  // Add "Otros" option to subsystems list
  const subsystemsWithOtros = useMemo(() => {
    return [...subsystems, "Otros"];
  }, [subsystems]);

  // Check if "Otros" is selected
  const isOtrosSelected = subsistema === "Otros";

  // Effective subsystem for API calls
  const effectiveSubsistema = isOtrosSelected ? customSubsistema : subsistema;

  // Effective frequency for API calls
  const effectiveFrecuencia = isOtrosSelected ? customFrecuencia : frecuencia;

  const { data: freqData, isLoading: isLoadingFreq } = useTemplateFilters(
    "work",
    effectiveSubsistema || undefined,
  );
  const frequencies = freqData?.frecuencias || [];

  const { data: activities, isLoading: isLoadingActivities } =
    useActivitiesBySubsystemAndFrequency({
      tipoReporte: "work",
      subsistema: effectiveSubsistema || undefined,
      frecuenciaCodigo: effectiveFrecuencia || undefined,
    });

  // Fetch workers - include inactive to show all workers
  const {
    data: workers = [],
    isLoading: isLoadingWorkers,
    error: workersError,
  } = useWorkers(undefined, true);
  const workerOptions = useMemo(() => {
    if (!workers || workers.length === 0) return [];
    return workers
      .filter((w) => w.active)
      .map((w) => ({ value: w.name, label: w.name }));
  }, [workers]);

  // Log for debugging
  useEffect(() => {
    if (workersError) {
      console.error("Error fetching workers:", workersError);
    }
    console.log("Workers data:", { workers, workerOptions, isLoadingWorkers });
  }, [workers, workerOptions, isLoadingWorkers, workersError]);

  // Fetch inventory
  const { data: warehouseItems = [], isLoading: loadingInventory } =
    useWarehouseItems({ status: "active" });

  const { herramientasOptions, refaccionesOptions } = useMemo(() => {
    const toOption = (item: WarehouseItem) => {
      const stockInfo =
        typeof item.quantityOnHand === "number"
          ? ` · Stock: ${item.quantityOnHand}${item.unit ? ` ${item.unit}` : ""}`
          : "";
      return {
        value: item.name,
        label: `${item.name}${stockInfo}`,
      };
    };

    const filterByCategory = (category: string) =>
      warehouseItems
        .filter((item) => item.category?.toLowerCase() === category)
        .map(toOption);

    const baseOptions = warehouseItems.map(toOption);
    const herramientas = filterByCategory("herramientas");
    const refacciones = filterByCategory("refacciones");

    return {
      herramientasOptions: herramientas.length > 0 ? herramientas : baseOptions,
      refaccionesOptions: refacciones.length > 0 ? refacciones : baseOptions,
    };
  }, [warehouseItems]);

  useEffect(() => {
    if (user?.name) {
      setValue("nombreResponsable", user.name);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (draftStatus === "empty") {
      setValue("fechaHoraInicio", new Date().toISOString().slice(0, 16));
    }
  }, [draftStatus, setValue]);

  useEffect(() => {
    if (fechaHoraInicio) {
      const date = new Date(fechaHoraInicio);
      const hour = date.getHours();
      let shift = "Nocturno";
      if (hour >= 6 && hour < 14) shift = "Matutino";
      else if (hour >= 14 && hour < 22) shift = "Vespertino";
      setValue("turno", shift);
    }
  }, [fechaHoraInicio, setValue]);

  useEffect(() => {
    if (draftRestorationGuardRef.current) return;
    setActivitiesState([]);
  }, [subsistema, frecuencia]);

  useEffect(() => {
    if (draftRestorationGuardRef.current) return;
    if (activities && activities.length > 0) {
      setActivitiesState(
        activities.map((act) => ({
          id: act.id,
          name: act.name,
          code: act.code,
          template: act.template,
          isSelected: false,
          observaciones: "",
          evidencias: [],
          expanded: false,
        })),
      );
    }
  }, [activities]);

  useEffect(() => {
    const selected = activitiesState.filter((a) => a.isSelected);
    const formActivities = selected.map((a) => ({
      templateId: a.template._id || a.id,
      nombre: a.name,
      realizado: true,
      observaciones: a.observaciones,
      evidencias: a.evidencias,
    }));
    setValue("actividadesRealizadas", formActivities);
    setValue(
      "templateIds",
      selected.map((a) => a.template._id || a.id),
    );
  }, [activitiesState, setValue]);

  // Sync custom frequency with form field when "Otros" is selected
  useEffect(() => {
    if (isOtrosSelected) {
      if (customSubsistema) setValue("subsistema", customSubsistema);
      if (customFrecuencia) setValue("frecuencia", customFrecuencia);
    }
  }, [isOtrosSelected, customSubsistema, customFrecuencia, setValue]);

  // Load draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedDraft = localStorage.getItem(WORK_REPORT_DRAFT_KEY);
    if (savedDraft) {
      const shouldLoad = window.confirm(
        "Se encontró un borrador guardado. ¿Deseas cargarlo?",
      );
      if (shouldLoad) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formValues) {
            draftRestorationGuardRef.current = true;
            reset(parsed.formValues);
            // Restore activities state logic would be complex here, keeping it simple for now
            // Ideally we would match IDs and restore observations
            setTimeout(() => {
              draftRestorationGuardRef.current = false;
            }, 500);
          }
          setDraftStatus("loaded");
        } catch (e) {
          console.error("Error loading draft", e);
        }
      } else {
        localStorage.removeItem(WORK_REPORT_DRAFT_KEY);
      }
    }
  }, [reset]);

  const toggleActivity = (id: string) => {
    setActivitiesState((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, isSelected: !a.isSelected, expanded: !a.isSelected }
          : a,
      ),
    );
  };

  const updateActivityObservaciones = (id: string, value: string) => {
    setActivitiesState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, observaciones: value } : a)),
    );
  };

  const updateActivityEvidencias = (id: string, files: LocalEvidence[]) => {
    setActivitiesState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, evidencias: files } : a)),
    );
  };

  // Custom activities helper functions
  const addCustomActivity = () => {
    const newActivity: ActivityWithDetails = {
      id: `custom-${Date.now()}`,
      name: "",
      template: {} as Template,
      isSelected: true,
      observaciones: "",
      evidencias: [],
      expanded: true,
    };
    setCustomActivities((prev) => [...prev, newActivity]);
  };

  const removeCustomActivity = (id: string) => {
    setCustomActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const updateCustomActivityName = (id: string, name: string) => {
    setCustomActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name } : a)),
    );
  };

  const updateCustomActivityObservaciones = (
    id: string,
    observaciones: string,
  ) => {
    setCustomActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, observaciones } : a)),
    );
  };

  const updateCustomActivityEvidencias = (
    id: string,
    files: LocalEvidence[],
  ) => {
    setCustomActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, evidencias: files } : a)),
    );
  };

  const handleSaveDraft = async () => {
    if (typeof window === "undefined") return;

    try {
      const currentValues = getValues();
      const actividadesConEvidencias = await prepareActivityEvidence(
        currentValues.actividadesRealizadas || [],
      );
      const firmaResponsable = await convertSignatureToBase64(
        currentValues.firmaResponsable || null,
      );

      const draftPayload = {
        formValues: {
          ...currentValues,
          actividadesRealizadas: actividadesConEvidencias,
          firmaResponsable,
        },
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(WORK_REPORT_DRAFT_KEY, JSON.stringify(draftPayload));
      alert("Borrador guardado correctamente");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("No se pudo guardar el borrador");
    }
  };

  const createReportMutation = useCreateWorkReportMutation();
  const updateReportMutation = useUpdateWorkReportMutation();

  /**
   * Convert base64 data URL to File object
   */
  const base64ToFile = (base64Data: string, filename: string): File => {
    const arr = base64Data.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  /**
   * Upload evidences from activities to S3 bucket and return evidence info grouped by activity
   */
  const uploadAllEvidences = async (
    reportId: string,
    subsystem: string,
    fechaHoraInicio: string,
    activities: ActivityWithDetails[],
  ): Promise<Map<string, any[]>> => {
    const selectedActivities = activities.filter((a) => a.isSelected);
    const evidenceMap = new Map<string, any[]>();

    // Upload evidences for each activity
    for (const activity of selectedActivities) {
      if (!activity.evidencias || activity.evidencias.length === 0) {
        evidenceMap.set(activity.template._id || activity.id, []);
        continue;
      }

      const activityEvidences: any[] = [];
      for (let i = 0; i < activity.evidencias.length; i++) {
        const evidence = activity.evidencias[i];

        // Skip if already uploaded (has http URL)
        if (evidence.previewUrl && evidence.previewUrl.startsWith("http")) {
          activityEvidences.push({
            id: evidence.id,
            key: evidence.previewUrl,
          });
          continue;
        }

        // Get base64 data
        const dataUrl = evidence.base64 || evidence.previewUrl;
        if (!dataUrl || !dataUrl.startsWith("data:")) {
          console.warn(
            `Skipping invalid evidence for activity ${activity.name}`,
          );
          continue;
        }

        // Convert base64 to File
        const file = base64ToFile(
          dataUrl,
          evidence.name || `evidence-${i}.jpg`,
        );

        try {
          const evidenceInfo = await uploadEvidence({
            reportId,
            reportType: "work",
            file,
            subsystem,
            fechaHoraInicio,
            skipDbRecord: true,
          });
          activityEvidences.push({
            id: evidenceInfo.id,
            key: evidenceInfo.key,
            originalName: evidenceInfo.originalName,
            mimeType: evidenceInfo.mimeType,
            size: evidenceInfo.size,
          });
        } catch (err) {
          console.error(
            `Failed to upload evidence for activity ${activity.name}:`,
            err,
          );
          // Continue with other uploads even if one fails
        }
      }
      evidenceMap.set(activity.template._id || activity.id, activityEvidences);
    }

    return evidenceMap;
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    const errorMessages: string[] = [];

    // Collect all error messages
    Object.keys(errors).forEach((key) => {
      const error = errors[key];
      if (error?.message) {
        errorMessages.push(error.message);
      }
    });

    if (errorMessages.length > 0) {
      alert(
        `Por favor corrige los siguientes errores:\n\n${errorMessages.join("\n")}`,
      );
    }

    // Scroll to first error
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const onSubmit = async (data: WorkReportFormValues) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    data.fechaHoraTermino = localISOTime;

    // Use custom activities when "Otros" is selected, otherwise use template-based activities
    const selectedActivitiesData = isOtrosSelected
      ? customActivities
      : activitiesState.filter((a) => a.isSelected);

    // For now, send empty evidencias array - they will be uploaded separately after report creation
    // The backend will link them via the storage system
    const actividadesConEvidencias = selectedActivitiesData.map((act) => ({
      templateId: act.template._id || act.id,
      nombre: act.name,
      realizado: true,
      observaciones: act.observaciones,
      evidencias: [], // Will be uploaded to S3 separately
    }));

    try {
      // Step 1: Upload signature to S3 if present
      let firmaResponsableKey: string | null = null;
      if (data.firmaResponsable) {
        try {
          // Generate temporary report ID for S3 path
          const tempReportId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          const signatureResult = await uploadWorkReportSignature(
            data.firmaResponsable,
            isEditMode && reportId ? reportId : tempReportId,
            effectiveSubsistema,
            data.fechaHoraInicio || localISOTime,
          );

          firmaResponsableKey = signatureResult.firmaResponsable;
        } catch (err) {
          console.error("Error uploading signature:", err);
          alert("Error al subir la firma. Por favor intenta de nuevo.");
          return;
        }
      }

      // Step 2: Prepare payload with S3 signature key
      const payload = {
        ...data,
        firmaResponsable: firmaResponsableKey, // Use S3 key instead of base64
        subsistema: effectiveSubsistema, // Use custom subsystem if "Otros" is selected
        frecuencia: effectiveFrecuencia, // Use custom frequency if "Otros" is selected
        actividadesRealizadas: actividadesConEvidencias,
        templateIds: selectedActivitiesData.map((a) => a.template._id || a.id),
        tipoMantenimiento:
          selectedActivitiesData[0]?.template.tipoMantenimiento || "Preventivo",
        // Legacy fields required by backend
        inspeccionRealizada: actividadesConEvidencias[0]?.realizado ?? false,
        observacionesActividad:
          actividadesConEvidencias[0]?.observaciones ?? "",
      };

      // Step 3: Create or update report
      if (isEditMode && reportId) {
        await updateReportMutation.mutateAsync({
          id: reportId,
          data: payload as any,
        });
        alert("Reporte actualizado exitosamente");
        router.push(`/reports/${reportId}`);
      } else {
        const result = await createReportMutation.mutateAsync(payload as any);
        const reportIdFromResponse = (result as any)._id;

        if (reportIdFromResponse) {
          // Upload evidences to S3 with the new reportId
          try {
            const evidenceMap = await uploadAllEvidences(
              reportIdFromResponse,
              data.subsistema,
              data.fechaHoraInicio,
              activitiesState,
            );

            // Update the report with evidence references
            const updatedActividades = selectedActivitiesData.map((act) => {
              const evidences =
                evidenceMap.get(act.template._id || act.id) || [];
              return {
                templateId: act.template._id || act.id,
                nombre: act.name,
                realizado: true,
                observaciones: act.observaciones,
                evidencias: evidences,
              };
            });

            // Update report with evidence references
            await updateReportMutation.mutateAsync({
              id: reportIdFromResponse,
              data: {
                actividadesRealizadas: updatedActividades,
              } as any,
            });
          } catch (err) {
            console.error("Error uploading evidences:", err);
            alert(
              "⚠️ Las evidencias no se pudieron cargar. El reporte se guardó sin imágenes.",
            );
            // Don't block the user - report is already created
          }
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem(WORK_REPORT_DRAFT_KEY);
        }

        alert("Reporte generado exitosamente");
        router.push(`/reports/${reportIdFromResponse}`);
      }
    } catch (error) {
      console.error(
        isEditMode ? "Error updating report:" : "Error creating report:",
        error,
      );

      // Handle specific error codes from idempotency system
      if ((error as any).code === "DUPLICATE_IN_PROGRESS") {
        alert(
          "El reporte ya se está generando. Por favor espera unos segundos y revisa tu lista de reportes.",
        );
      } else if ((error as any).status === 409) {
        alert(
          "Esta solicitud está siendo procesada. Por favor espera un momento.",
        );
      } else {
        alert(
          isEditMode
            ? "Error al actualizar el reporte"
            : "Error al generar el reporte",
        );
      }
    }
  };

  const watchedValues = watch();
  const selectedActivities = isOtrosSelected
    ? customActivities
    : activitiesState.filter((a) => a.isSelected);

  const previewValues = {
    ...watchedValues,
    actividadesRealizadas: selectedActivities.map((a) => ({
      nombre: a.name,
      realizado: true,
      observaciones: a.observaciones,
      evidenciasCount: a.evidencias.length,
    })),
  };

  const hasSelectedActivities = selectedActivities.length > 0;

  return (
    <div className="min-h-screen bg-white pb-12 font-sans text-gray-900">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {isEditMode
              ? "Editar Reporte de Trabajo"
              : "Formato de trabajo proyecto AEROTREN AICM"}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            {isEditMode
              ? "Modifica los datos del reporte y guarda los cambios."
              : "Selecciona las actividades realizadas y registra observaciones y evidencias."}
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Form Section */}
          <div className="w-full">
            <form
              onSubmit={handleSubmit(onSubmit as any, onError)}
              className="w-full space-y-6"
            >
              {/* Section 1: Datos Generales */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Datos generales
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subsistema">Subsistema</Label>
                    <Controller
                      name="subsistema"
                      control={control}
                      render={({ field }) => (
                        <>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value !== "Otros") {
                                setCustomSubsistema("");
                                setCustomFrecuencia("");
                              }
                            }}
                            value={field.value}
                            disabled={isLoadingFilters}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {subsystemsWithOtros.map((sub) => (
                                <SelectItem key={sub} value={sub}>
                                  {sub}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {isOtrosSelected && (
                            <div className="mt-2">
                              <Input
                                placeholder="Especifica el subsistema..."
                                value={customSubsistema}
                                onChange={(e) =>
                                  setCustomSubsistema(e.target.value)
                                }
                                className="w-full"
                              />
                            </div>
                          )}
                        </>
                      )}
                    />
                    {errors.subsistema && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.subsistema.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia">Frecuencia</Label>
                    {isOtrosSelected ? (
                      // Show text input when "Otros" is selected
                      <Input
                        placeholder="Especifica la frecuencia..."
                        value={customFrecuencia}
                        onChange={(e) => setCustomFrecuencia(e.target.value)}
                        className="w-full"
                      />
                    ) : (
                      // Show dropdown for regular subsystems
                      <Controller
                        name="frecuencia"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!effectiveSubsistema || isLoadingFreq}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={
                                  effectiveSubsistema
                                    ? "Seleccionar..."
                                    : "Selecciona un subsistema"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {frequencies.map((freq) => (
                                <SelectItem key={freq.code} value={freq.code}>
                                  {freq.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    )}
                    {errors.frecuencia && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.frecuencia.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input
                      {...register("ubicacion")}
                      placeholder="Ej. Centro de Operación T2 PK N/A"
                      className="w-full"
                    />
                    {errors.ubicacion && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.ubicacion.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Trabajadores Involucrados</Label>
                    {isLoadingWorkers ? (
                      <div className="text-sm text-gray-500">
                        Cargando trabajadores...
                      </div>
                    ) : workersError ? (
                      <div className="text-sm text-red-500">
                        Error al cargar trabajadores
                      </div>
                    ) : (
                      <Controller
                        name="trabajadores"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={workerOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={
                              workerOptions.length === 0
                                ? "No hay trabajadores disponibles"
                                : "Seleccionar..."
                            }
                          />
                        )}
                      />
                    )}
                    {errors.trabajadores && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.trabajadores.message}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Section 2: Actividades */}
              {effectiveSubsistema && effectiveFrecuencia && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                        2
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Actividades
                      </h2>
                      {hasSelectedActivities && (
                        <Badge className="ml-3 bg-[#F0493B] hover:bg-[#F0493B]/90 text-white">
                          {selectedActivities.length} seleccionada(s)
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    {isOtrosSelected ? (
                      // Custom activities for "Otros" subsystem
                      <div className="space-y-4">
                        {customActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className="p-4 rounded-lg border bg-blue-50/50 border-blue-200 shadow-sm"
                          >
                            {/* Header: Activity Name Input + Delete Button */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="flex-1">
                                <Label className="text-xs font-semibold text-blue-900 mb-2 block">
                                  Nombre de la actividad
                                </Label>
                                <Input
                                  placeholder="Ej. Revisión de sistema eléctrico..."
                                  value={activity.name}
                                  onChange={(e) =>
                                    updateCustomActivityName(
                                      activity.id,
                                      e.target.value,
                                    )
                                  }
                                  className="bg-white"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeCustomActivity(activity.id)
                                }
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 mt-6"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Observations */}
                            <div className="space-y-2 mb-4">
                              <Label className="text-xs font-semibold text-blue-900">
                                Observaciones
                              </Label>
                              <Textarea
                                value={activity.observaciones}
                                onChange={(e) =>
                                  updateCustomActivityObservaciones(
                                    activity.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Escribe observaciones para esta actividad..."
                                className="bg-white min-h-[80px]"
                              />
                            </div>

                            {/* Evidences */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-blue-900">
                                Evidencias Fotográficas (máx. 5)
                              </Label>
                              <div className="bg-white p-3 rounded-lg border border-blue-100">
                                <ImageUpload
                                  label=""
                                  onChange={(files) =>
                                    updateCustomActivityEvidencias(
                                      activity.id,
                                      files,
                                    )
                                  }
                                  compact
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={addCustomActivity}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Actividad
                        </Button>
                      </div>
                    ) : isLoadingActivities ? (
                      <div className="text-center py-8 text-gray-500">
                        Cargando actividades...
                      </div>
                    ) : activitiesState.length > 0 ? (
                      <div className="space-y-4">
                        {activitiesState.map((activity) => (
                          <div
                            key={activity.id}
                            className={`p-4 rounded-lg border transition-all duration-200 relative group ${
                              activity.isSelected
                                ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                : "bg-gray-50/50 border-gray-100 hover:bg-gray-100/50"
                            }`}
                          >
                            {/* Header: Checkbox + Name */}
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={activity.isSelected}
                                onCheckedChange={() =>
                                  toggleActivity(activity.id)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-sm font-medium ${activity.isSelected ? "text-blue-900" : "text-gray-900"}`}
                                  >
                                    {activity.name}
                                  </span>
                                  {activity.isSelected && (
                                    <Badge className="bg-green-600 hover:bg-green-600 text-white ml-2">
                                      SÍ
                                    </Badge>
                                  )}
                                </div>
                                {activity.code && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {activity.code}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Expanded Content (Visible when selected) */}
                            {activity.isSelected && (
                              <div className="pt-4 space-y-4">
                                {/* Observations - Full Width */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-blue-900">
                                    Observaciones
                                  </Label>
                                  <Textarea
                                    value={activity.observaciones}
                                    onChange={(e) =>
                                      updateActivityObservaciones(
                                        activity.id,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Escribe observaciones para esta actividad..."
                                    className="bg-white min-h-[80px]"
                                  />
                                </div>

                                {/* Evidences - Bottom */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-blue-900">
                                    Evidencias Fotográficas (máx. 5)
                                  </Label>
                                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                                    <ImageUpload
                                      label=""
                                      onChange={(files) =>
                                        updateActivityEvidencias(
                                          activity.id,
                                          files,
                                        )
                                      }
                                      compact
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                        No se encontraron actividades para esta selección.
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Section 3: Herramientas y refacciones */}
              {hasSelectedActivities && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      3
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Herramientas y refacciones
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Herramientas */}
                    <div className="space-y-2">
                      <Label>Herramientas utilizadas</Label>
                      <Controller
                        name="herramientas"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={herramientasOptions}
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder="Seleccionar herramientas..."
                          />
                        )}
                      />
                    </div>

                    {/* Refacciones */}
                    <div className="space-y-2">
                      <Label>Refacciones utilizadas</Label>
                      <Controller
                        name="refacciones"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={refaccionesOptions}
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder="Seleccionar refacciones..."
                          />
                        )}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Section 4: Cierre y Firmas */}
              {hasSelectedActivities && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      4
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Cierre y Firmas
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">
                        Observaciones Generales
                      </Label>
                      <Textarea
                        {...register("observacionesGenerales")}
                        placeholder="Comentarios generales del trabajo realizado..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex flex-col gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <Label className="mb-2 block">
                          Nombre del Supervisor
                        </Label>
                        <Input
                          {...register("nombreResponsable")}
                          placeholder="Nombre completo"
                          disabled
                          readOnly
                          className="bg-gray-50 text-gray-500"
                        />
                      </div>
                      <Card className="p-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-0">
                            Firma del Supervisor
                          </h3>
                          <Controller
                            name="firmaResponsable"
                            control={control}
                            render={({ field }) => (
                              <SignaturePad
                                label="Firma digital"
                                onChange={field.onChange}
                              />
                            )}
                          />
                          {errors.firmaResponsable && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.firmaResponsable.message}
                            </p>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                </Card>
              )}

              {/* Submit */}
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="mr-4 border-[#153A7A] text-[#153A7A] hover:bg-[#153A7A]/10"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Borrador
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    updateReportMutation.isPending ||
                    !hasSelectedActivities
                  }
                  className="px-8 bg-[#153A7A] hover:bg-[#153A7A]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    console.log("Submit button clicked", {
                      isSubmitting,
                      isPending: updateReportMutation.isPending,
                      hasSelectedActivities,
                      errors: Object.keys(errors),
                    });
                    if (!hasSelectedActivities) {
                      e.preventDefault();
                      alert(
                        "Por favor selecciona al menos una actividad antes de generar el reporte.",
                      );
                      return;
                    }
                  }}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting || updateReportMutation.isPending
                    ? "Guardando..."
                    : isEditMode
                      ? "Actualizar Reporte"
                      : "Generar Reporte"}
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="w-full">
            <div className="sticky top-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-gray-500">
                Vista previa del reporte
              </h3>
              <WorkReportPreview values={previewValues as any} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
