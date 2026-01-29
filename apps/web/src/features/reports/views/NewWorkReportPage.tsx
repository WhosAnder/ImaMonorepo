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
import { useForm, Controller } from "react-hook-form";
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
import { LocalEvidence } from "@/shared/ui/ImageUpload";
import {
  workReportSchema,
  WorkReportFormValues,
} from "../schemas/workReportSchema";
import { Save, Plus, Trash2 } from "lucide-react";
import { Template } from "@/types/template";
import { WorkReportPreview } from "../components/WorkReportPreview";
import { EvidencePhaseSection } from "../components/EvidencePhaseSection";
import { useAuth } from "@/auth/AuthContext";
import type { WarehouseItem } from "@/api/warehouseClient";
import { uploadEvidence } from "@/api/evidencesClient";
import {
  blobToDataUrl,
  buildBlobId,
  buildDraftId,
  dataUrlToBlob,
  deleteDraftBlob,
  deleteDraftRecord,
  getDraftBlob,
  getDraftRecord,
  listDraftBlobs,
  saveDraftBlob,
  saveDraftRecord,
} from "@/features/reports/drafts/draftStorage";
import { createDraft, fetchDraft, updateDraft, deleteDraft } from "@/api/draftsClient";
import { presignDownload } from "@/api/evidencesClient";
import { API_URL } from "@/config/env";
import { uploadWorkReportSignature } from "../helpers/upload-signature";
import { applyWatermarkToImage } from "@/shared/utils/image-watermark";


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
  const isAdmin = user?.role === "admin";
  const [activitiesState, setActivitiesState] = useState<ActivityWithDetails[]>(
    [],
  );
  const [draftStatus, setDraftStatus] = useState<"empty" | "loaded">("empty");
  const draftRestorationGuardRef = useRef(false);
  const [customActivities, setCustomActivities] = useState<
    ActivityWithDetails[]
  >([]);

  // Three-phase evidence system state
  const [evidencePhases, setEvidencePhases] = useState<{
    antes: { evidences: LocalEvidence[]; isLocked: boolean };
    durante: { evidences: LocalEvidence[]; isLocked: boolean };
    despues: { evidences: LocalEvidence[]; isLocked: boolean };
  }>({
    antes: { evidences: [], isLocked: false },
    durante: { evidences: [], isLocked: false },
    despues: { evidences: [], isLocked: false },
  });

  const [activePhase, setActivePhase] = useState<
    "antes" | "durante" | "despues"
  >("antes");
  const [savingPhase, setSavingPhase] = useState<
    "antes" | "durante" | "despues" | null
  >(null);

  const isEditMode = Boolean(reportId);

  // Fetch existing report data when in edit mode
  const { data: existingReport, isLoading: isLoadingReport } =
    useWorkReportQuery(reportId || "");

  const initialFormValues = {
    subsistema: "",
    customSubsistema: "",
    cliente: "AEROTREN AICM",
    ubicacion: "",
    fechaHoraInicio: new Date().toISOString().slice(0, 16),
    turno: "",
    frecuencia: "",
    customFrecuencia: "",
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
  const customSubsistema = watch("customSubsistema");
  const customFrecuencia = watch("customFrecuencia");

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
  }, [effectiveSubsistema, effectiveFrecuencia]);

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

  const hydrateEvidenceList = async (
    draftId: string,
    evidences: LocalEvidence[],
  ): Promise<LocalEvidence[]> => {
    const buildFallbackUrl = (key: string) =>
      `${API_URL}/api/storage/evidences/${encodeURIComponent(key)}`;

    return Promise.all(
      (evidences || []).map(async (evidence) => {
        if (evidence.s3Key) {
          try {
            const { url } = await presignDownload({ key: evidence.s3Key });
            return {
              ...evidence,
              previewUrl: url,
            };
          } catch (error) {
            console.error("Error presigning evidence:", error);
            return {
              ...evidence,
              previewUrl: buildFallbackUrl(evidence.s3Key),
            };
          }
        }
        if (evidence.previewUrl) {
          if (
            typeof evidence.previewUrl === "string" &&
            !evidence.previewUrl.startsWith("data:") &&
            !evidence.previewUrl.startsWith("http")
          ) {
            try {
              const { url } = await presignDownload({
                key: evidence.previewUrl,
              });
              return {
                ...evidence,
                previewUrl: url,
              };
            } catch (error) {
              console.error("Error presigning evidence:", error);
              return {
                ...evidence,
                previewUrl: buildFallbackUrl(evidence.previewUrl),
              };
            }
          }
          return evidence;
        }
        if (!evidence.blobId) return evidence;
        const blobRecord = await getDraftBlob(evidence.blobId);
        if (!blobRecord?.blob) return evidence;
        const dataUrl = await blobToDataUrl(blobRecord.blob);
        return {
          ...evidence,
          previewUrl: dataUrl,
          base64: dataUrl,
        };
      }),
    );
  };

  const hydrateEvidencePhases = async (
    draftId: string,
    phases: typeof evidencePhases,
  ) => {
    return {
      antes: {
        ...phases.antes,
        evidences: await hydrateEvidenceList(draftId, phases.antes.evidences),
      },
      durante: {
        ...phases.durante,
        evidences: await hydrateEvidenceList(draftId, phases.durante.evidences),
      },
      despues: {
        ...phases.despues,
        evidences: await hydrateEvidenceList(draftId, phases.despues.evidences),
      },
    };
  };

  // Load draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const loadDraft = async () => {
      try {
        const localDraft = await getDraftRecord<any>(user.id, "work");
        const serverDraft = localDraft ? null : await fetchDraft("work");
        const draftData = localDraft?.data || serverDraft?.formData;

        if (draftData?.formValues) {
          const shouldLoad = window.confirm(
            "Se encontró un borrador guardado. ¿Deseas cargarlo?",
          );
          if (!shouldLoad) return;

          draftRestorationGuardRef.current = true;
          reset(draftData.formValues);
          if (draftData.formValues?.subsistema) {
            setValue("subsistema", draftData.formValues.subsistema, {
              shouldDirty: false,
              shouldValidate: true,
            });
          }
          if (draftData.formValues?.frecuencia) {
            setValue("frecuencia", draftData.formValues.frecuencia, {
              shouldDirty: false,
              shouldValidate: true,
            });
          }
          if (draftData.formValues?.customSubsistema) {
            setValue("customSubsistema", draftData.formValues.customSubsistema, {
              shouldDirty: false,
              shouldValidate: true,
            });
          }
          if (draftData.formValues?.customFrecuencia) {
            setValue("customFrecuencia", draftData.formValues.customFrecuencia, {
              shouldDirty: false,
              shouldValidate: true,
            });
          }
          if (draftData.evidencePhases) {
            const draftId = buildDraftId(user.id, "work");
            const hydratedPhases = await hydrateEvidencePhases(
              draftId,
              draftData.evidencePhases,
            );
            setEvidencePhases(hydratedPhases);
          }
          setTimeout(() => {
            draftRestorationGuardRef.current = false;
          }, 500);
          setDraftStatus("loaded");
        }
      } catch (e) {
        console.error("Error loading draft", e);
      }
    };

    loadDraft();
  }, [reset, user?.id]);

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

  // Evidence phase handlers
  const handleEvidencePhaseChange = (
    phase: "antes" | "durante" | "despues",
    files: LocalEvidence[],
  ) => {
    setEvidencePhases((prev) => ({
      ...prev,
      [phase]: { ...prev[phase], evidences: files },
    }));
  };

  const resolvePreviewUrlForKey = async (key: string): Promise<string> => {
    try {
      const { url } = await presignDownload({ key });
      return url;
    } catch (error) {
      console.error("Error presigning evidence:", error);
      return `${API_URL}/api/storage/evidences/${encodeURIComponent(key)}`;
    }
  };

  const ensureEvidenceBlob = async (draftId: string, evidence: LocalEvidence) => {
    const dataUrl = evidence.base64 || evidence.previewUrl;
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      return evidence;
    }
    const blobId = evidence.blobId || buildBlobId(draftId, evidence.id);
    if (!evidence.blobId) {
      const blob = dataUrlToBlob(dataUrl);
      await saveDraftBlob({
        id: blobId,
        draftId,
        evidenceId: evidence.id,
        blob,
        name: evidence.name || evidence.originalName,
        type: blob.type,
        size: blob.size,
        createdAt: new Date().toISOString(),
      });
    }
    return {
      ...evidence,
      blobId,
      syncState: evidence.syncState || "pending",
    };
  };

  const stripEvidence = (evidence: LocalEvidence) => {
    if (
      typeof evidence.previewUrl === "string" &&
      evidence.previewUrl.startsWith("data:")
    ) {
      return {
        ...evidence,
        previewUrl: "",
        base64: "",
      } as LocalEvidence;
    }
    return {
      ...evidence,
      base64: "",
    } as LocalEvidence;
  };

  const persistDraftSnapshot = async (
    phases: typeof evidencePhases,
  ): Promise<void> => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const draftId = buildDraftId(user.id, "work");
    const currentValues = getValues();

    const actividadesConEvidencias = await prepareActivityEvidence(
      currentValues.actividadesRealizadas || [],
    );
    const firmaResponsable = await convertSignatureToBase64(
      currentValues.firmaResponsable || null,
    );

    const processedPhases = {
      antes: {
        ...phases.antes,
        evidences: await Promise.all(
          phases.antes.evidences.map((evidence) =>
            ensureEvidenceBlob(draftId, evidence),
          ),
        ),
      },
      durante: {
        ...phases.durante,
        evidences: await Promise.all(
          phases.durante.evidences.map((evidence) =>
            ensureEvidenceBlob(draftId, evidence),
          ),
        ),
      },
      despues: {
        ...phases.despues,
        evidences: await Promise.all(
          phases.despues.evidences.map((evidence) =>
            ensureEvidenceBlob(draftId, evidence),
          ),
        ),
      },
    };

    const storedPhases = {
      antes: {
        ...processedPhases.antes,
        evidences: processedPhases.antes.evidences.map(stripEvidence),
      },
      durante: {
        ...processedPhases.durante,
        evidences: processedPhases.durante.evidences.map(stripEvidence),
      },
      despues: {
        ...processedPhases.despues,
        evidences: processedPhases.despues.evidences.map(stripEvidence),
      },
    };

    const draftPayload = {
      formValues: {
        ...currentValues,
        actividadesRealizadas: actividadesConEvidencias,
        firmaResponsable,
      },
      evidencePhases: storedPhases,
      timestamp: new Date().toISOString(),
    };

    await saveDraftRecord({
      id: draftId,
      userId: user.id,
      reportType: "work",
      data: draftPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const serverPayload = {
      reportType: "work" as const,
      formData: draftPayload,
      evidenceRefs: [
        ...storedPhases.antes.evidences,
        ...storedPhases.durante.evidences,
        ...storedPhases.despues.evidences,
      ].map((evidence) => ({ ...evidence })) as Record<string, unknown>[],
      status: "active" as const,
    };

    const existingDraft = await fetchDraft("work");
    if (existingDraft?.id) {
      await updateDraft(existingDraft.id, serverPayload);
    } else {
      await createDraft(serverPayload);
    }
  };

  const handleSavePhase = async (phase: "antes" | "durante" | "despues") => {
    if (typeof window === "undefined") return;
    if (!user?.id) {
      alert("No se pudo guardar la fase. Sesión no encontrada.");
      return;
    }

    const draftId = buildDraftId(user.id, "work");
    const uploadId = draftId.replace(/[:]/g, "-");
    const currentValues = getValues();
    const subsistemaValue = effectiveSubsistema || currentValues.subsistema;
    if (!subsistemaValue || !currentValues.fechaHoraInicio) {
      alert(
        "Completa el subsistema y la fecha de inicio antes de guardar las evidencias.",
      );
      return;
    }

    try {
      setSavingPhase(phase);
      const phaseLabel =
        phase === "antes" ? "Antes" : phase === "durante" ? "Durante" : "Después";

      const phaseState = evidencePhases[phase];
      const updatedEvidences: LocalEvidence[] = [];

      for (let i = 0; i < phaseState.evidences.length; i++) {
        const evidence = phaseState.evidences[i];
        if (evidence.isLocked && evidence.s3Key) {
          updatedEvidences.push(evidence);
          continue;
        }

        const dataUrl = evidence.base64 || evidence.previewUrl;
        if (!dataUrl || !dataUrl.startsWith("data:")) {
          updatedEvidences.push(evidence);
          continue;
        }

        const watermarkedFile = await applyWatermarkToImage(dataUrl, {
          timestamp: new Date(),
          phaseLabel,
        });

        const evidenceInfo = await uploadEvidence({
          reportId: uploadId,
          reportType: "work",
          file: watermarkedFile,
          subsystem: subsistemaValue,
          fechaHoraInicio: currentValues.fechaHoraInicio,
          skipDbRecord: true,
        });

        const previewUrl = await resolvePreviewUrlForKey(evidenceInfo.key);

        updatedEvidences.push({
          ...evidence,
          s3Key: evidenceInfo.key,
          previewUrl,
          syncState: "synced",
          isLocked: true,
        });
      }

      const nextPhases = {
        ...evidencePhases,
        [phase]: {
          ...phaseState,
          evidences: await Promise.all(
            updatedEvidences.map((evidence) =>
              ensureEvidenceBlob(draftId, evidence),
            ),
          ),
          isLocked: true,
        },
      } as typeof evidencePhases;

      setEvidencePhases(nextPhases);

      if (phase === "antes") {
        setActivePhase("durante");
      } else if (phase === "durante") {
        setActivePhase("despues");
      }

      await persistDraftSnapshot(nextPhases);
    } catch (error) {
      console.error("Error saving phase:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la fase. Intenta nuevamente.";
      if (message.includes("Storage not configured")) {
        alert(
          "No se pudo subir la evidencia. Verifica que S3 esté configurado.",
        );
      } else {
        alert("No se pudo guardar la fase. Intenta nuevamente.");
      }
    } finally {
      setSavingPhase(null);
    }
  };

  const handleSaveDraft = async () => {
    if (typeof window === "undefined") return;
    if (!user?.id) {
      alert("No se pudo guardar el borrador. Sesión no encontrada.");
      return;
    }

    const draftId = buildDraftId(user.id, "work");
    const uploadId = draftId.replace(/[:]/g, "-");

    try {
      const currentValues = getValues();

      const processedPhases = {
        antes: {
          ...evidencePhases.antes,
          evidences: await Promise.all(
            evidencePhases.antes.evidences.map((evidence) =>
              ensureEvidenceBlob(draftId, evidence),
            ),
          ),
        },
        durante: {
          ...evidencePhases.durante,
          evidences: await Promise.all(
            evidencePhases.durante.evidences.map((evidence) =>
              ensureEvidenceBlob(draftId, evidence),
            ),
          ),
        },
        despues: {
          ...evidencePhases.despues,
          evidences: await Promise.all(
            evidencePhases.despues.evidences.map((evidence) =>
              ensureEvidenceBlob(draftId, evidence),
            ),
          ),
        },
      };

      const uploadPhaseEvidences = async (
        phaseKey: "antes" | "durante" | "despues",
        phaseLabel: string,
      ) => {
        const phase = processedPhases[phaseKey];
        const updated: LocalEvidence[] = [];

        for (let i = 0; i < phase.evidences.length; i++) {
          const evidence = phase.evidences[i];
          if (evidence.isLocked && evidence.s3Key) {
            updated.push(evidence);
            continue;
          }

          const dataUrl = evidence.base64 || evidence.previewUrl;
          if (!dataUrl || !dataUrl.startsWith("data:")) {
            updated.push(evidence);
            continue;
          }

          const watermarkedFile = await applyWatermarkToImage(dataUrl, {
            timestamp: new Date(),
            phaseLabel,
          });

          const evidenceInfo = await uploadEvidence({
            reportId: uploadId,
            reportType: "work",
            file: watermarkedFile,
            subsystem: effectiveSubsistema || currentValues.subsistema,
            fechaHoraInicio: currentValues.fechaHoraInicio,
            skipDbRecord: true,
          });

          updated.push({
            ...evidence,
            s3Key: evidenceInfo.key,
            previewUrl: await resolvePreviewUrlForKey(evidenceInfo.key),
            syncState: "synced",
            isLocked: true,
          });
        }

        return {
          ...phase,
          evidences: updated,
        };
      };

      const uploadedAntes = await uploadPhaseEvidences("antes", "Antes");
      const uploadedDurante = await uploadPhaseEvidences("durante", "Durante");
      const uploadedDespues = await uploadPhaseEvidences("despues", "Después");
      const nextPhases = {
        antes: uploadedAntes,
        durante: uploadedDurante,
        despues: uploadedDespues,
      };
      setEvidencePhases(nextPhases);

      await persistDraftSnapshot(nextPhases);

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

        try {
          // Check if image is already watermarked (filename contains '_wm')
          const isAlreadyWatermarked = evidence.name?.includes('_wm');
          
          let fileToUpload: File;
          
          if (isAlreadyWatermarked) {
            // Already watermarked (came from ImageUpload component), just convert to File
            fileToUpload = base64ToFile(
              dataUrl,
              evidence.name || `evidence-${i}.jpg`,
            );
          } else {
            // Not watermarked yet, apply watermark before upload
            console.log(`[WorkReport] Applying watermark to evidence ${i}`);
            const watermarkedFile = await applyWatermarkToImage(
              dataUrl,
              { timestamp: new Date() }
            );
            fileToUpload = watermarkedFile;
          }

          const evidenceInfo = await uploadEvidence({
            reportId,
            reportType: "work",
            file: fileToUpload,
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
    const allPhaseEvidences = [
      ...evidencePhases.antes.evidences,
      ...evidencePhases.durante.evidences,
      ...evidencePhases.despues.evidences,
    ];
    const hasPendingEvidence = allPhaseEvidences.some(
      (evidence) =>
        !(evidence.isLocked || evidence.s3Key || evidence.syncState === "synced"),
    );
    if (hasPendingEvidence) {
      alert(
        "Antes de generar el reporte, guarda el borrador para subir las evidencias.",
      );
      return;
    }

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
            effectiveSubsistema || data.subsistema,
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
      const { customSubsistema: _, customFrecuencia: __, ...restData } = data;
      const payload = {
        ...restData,
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
          // Upload three-phase evidences to S3
          try {
            const allPhaseEvidences: any[] = [];
            
            // Upload Antes phase
            for (let i = 0; i < evidencePhases.antes.evidences.length; i++) {
              const evidence = evidencePhases.antes.evidences[i];
              const dataUrl = evidence.base64 || evidence.previewUrl;
              
              if (dataUrl && dataUrl.startsWith("data:")) {
                // Apply watermark with phase label
                const watermarkedFile = await applyWatermarkToImage(
                  dataUrl,
                  { 
                    timestamp: new Date(),
                    phaseLabel: "Antes"
                  }
                );
                
                const evidenceInfo = await uploadEvidence({
                  reportId: reportIdFromResponse,
                  reportType: "work",
                  file: watermarkedFile,
                  subsystem: effectiveSubsistema || data.subsistema,
                  fechaHoraInicio: data.fechaHoraInicio,
                  skipDbRecord: true,
                });
                
                allPhaseEvidences.push({
                  ...evidenceInfo,
                  phase: "antes",
                });
              }
            }
            
            // Upload Durante phase
            for (let i = 0; i < evidencePhases.durante.evidences.length; i++) {
              const evidence = evidencePhases.durante.evidences[i];
              const dataUrl = evidence.base64 || evidence.previewUrl;
              
              if (dataUrl && dataUrl.startsWith("data:")) {
                // Apply watermark with phase label
                const watermarkedFile = await applyWatermarkToImage(
                  dataUrl,
                  { 
                    timestamp: new Date(),
                    phaseLabel: "Durante"
                  }
                );
                
                const evidenceInfo = await uploadEvidence({
                  reportId: reportIdFromResponse,
                  reportType: "work",
                  file: watermarkedFile,
                  subsystem: effectiveSubsistema || data.subsistema,
                  fechaHoraInicio: data.fechaHoraInicio,
                  skipDbRecord: true,
                });
                
                allPhaseEvidences.push({
                  ...evidenceInfo,
                  phase: "durante",
                });
              }
            }
            
            // Upload Después phase
            for (let i = 0; i < evidencePhases.despues.evidences.length; i++) {
              const evidence = evidencePhases.despues.evidences[i];
              const dataUrl = evidence.base64 || evidence.previewUrl;
              
              if (dataUrl && dataUrl.startsWith("data:")) {
                // Apply watermark with phase label
                const watermarkedFile = await applyWatermarkToImage(
                  dataUrl,
                  { 
                    timestamp: new Date(),
                    phaseLabel: "Después"
                  }
                );
                
                const evidenceInfo = await uploadEvidence({
                  reportId: reportIdFromResponse,
                  reportType: "work",
                  file: watermarkedFile,
                  subsystem: effectiveSubsistema || data.subsistema,
                  fechaHoraInicio: data.fechaHoraInicio,
                  skipDbRecord: true,
                });
                
                allPhaseEvidences.push({
                  ...evidenceInfo,
                  phase: "despues",
                });
              }
            }

            // Update the report with evidence references
            // Store all evidences in the first activity for now (backend compatibility)
            const updatedActividades = selectedActivitiesData.map((act, index) => {
              return {
                templateId: act.template._id || act.id,
                nombre: act.name,
                realizado: true,
                observaciones: act.observaciones,
                evidencias: index === 0 ? allPhaseEvidences : [],
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

        if (typeof window !== "undefined" && user?.id) {
          const draftId = buildDraftId(user.id, "work");
          
          // Delete local IndexedDB draft
          await deleteDraftRecord(draftId);
          const blobs = await listDraftBlobs(draftId);
          await Promise.all(blobs.map((blob) => deleteDraftBlob(blob.id)));
          
          // Delete server-side draft
          try {
            const serverDraft = await fetchDraft("work");
            if (serverDraft?.id) {
              await deleteDraft(serverDraft.id);
              console.log("✅ Server draft deleted successfully");
            }
          } catch (error) {
            console.error("Failed to delete server draft:", error);
            // Don't block user - local draft is already deleted
          }
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
  
  // Validation for three-phase evidence
  const allPhasesCompleted =
    evidencePhases.antes.isLocked &&
    evidencePhases.durante.isLocked &&
    evidencePhases.despues.isLocked;
    
  const totalEvidenceCount =
    evidencePhases.antes.evidences.length +
    evidencePhases.durante.evidences.length +
    evidencePhases.despues.evidences.length;
    
  const hasValidEvidenceCount = totalEvidenceCount >= 3 && totalEvidenceCount <= 9;

  return (
    <div className="min-h-screen bg-white pb-12 font-sans text-gray-900">
      <div className="max-w-[1600px] mx-auto px-0 sm:px-6 py-8">
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
                                setValue("customSubsistema", "");
                                setValue("customFrecuencia", "");
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
                                {...register("customSubsistema")}
                                className="w-full"
                              />
                              {errors.customSubsistema && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.customSubsistema.message}
                                </p>
                              )}
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
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      {...register("cliente")}
                      placeholder="Nombre del cliente"
                    />
                    {errors.cliente && (
                      <p className="text-sm text-red-500">
                        {errors.cliente.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia">Frecuencia</Label>
                      {isOtrosSelected ? (
                        // Show text input when "Otros" is selected
                        <div>
                          <Input
                            placeholder="Especifica la frecuencia..."
                            {...register("customFrecuencia")}
                            className="w-full"
                          />
                          {errors.customFrecuencia && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.customFrecuencia.message}
                            </p>
                          )}
                        </div>
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
                            className={`p-4 rounded-lg border transition-all duration-200 relative group ${activity.isSelected
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

              {/* Section 2.5: Evidencias Fotográficas (Three-Phase) */}
              {hasSelectedActivities && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      2.5
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Evidencias Fotográficas
                    </h2>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    Sube fotos de cada fase del mantenimiento. Mínimo 1 y máximo 3 fotos por fase.
                    Total requerido: entre 3 y 9 fotos.
                  </p>

                  <div className="space-y-6">
                    {/* Fase: Antes */}
                    <EvidencePhaseSection
                      phase="antes"
                      title="Antes del Mantenimiento"
                      description="Fotos del estado inicial antes de comenzar el trabajo"
                      evidences={evidencePhases.antes.evidences}
                      isLocked={evidencePhases.antes.isLocked}
                      isActive={activePhase === "antes"}
                      isSaving={savingPhase === "antes"}
                      allowLockedEdits={isAdmin}
                      onEvidencesChange={(files) =>
                        handleEvidencePhaseChange("antes", files)
                      }
                      onSave={() => handleSavePhase("antes")}
                      minPhotos={1}
                      maxPhotos={3}
                    />

                    {/* Fase: Durante */}
                    <EvidencePhaseSection
                      phase="durante"
                      title="Durante el Mantenimiento"
                      description="Fotos del proceso de trabajo en ejecución"
                      evidences={evidencePhases.durante.evidences}
                      isLocked={evidencePhases.durante.isLocked}
                      isActive={activePhase === "durante"}
                      isSaving={savingPhase === "durante"}
                      allowLockedEdits={isAdmin}
                      onEvidencesChange={(files) =>
                        handleEvidencePhaseChange("durante", files)
                      }
                      onSave={() => handleSavePhase("durante")}
                      minPhotos={1}
                      maxPhotos={3}
                    />

                    {/* Fase: Después */}
                    <EvidencePhaseSection
                      phase="despues"
                      title="Después del Mantenimiento"
                      description="Fotos del resultado final del trabajo completado"
                      evidences={evidencePhases.despues.evidences}
                      isLocked={evidencePhases.despues.isLocked}
                      isActive={activePhase === "despues"}
                      isSaving={savingPhase === "despues"}
                      allowLockedEdits={isAdmin}
                      onEvidencesChange={(files) =>
                        handleEvidencePhaseChange("despues", files)
                      }
                      onSave={() => handleSavePhase("despues")}
                      minPhotos={1}
                      maxPhotos={3}
                    />
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
              <div className="flex justify-end pt-4 sm:flex-row flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="w-auto border-[#153A7A] text-[#153A7A] hover:bg-[#153A7A]/10"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Borrador
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    updateReportMutation.isPending ||
                    !hasSelectedActivities ||
                    !allPhasesCompleted ||
                    !hasValidEvidenceCount
                  }
                  className="px-8 bg-[#153A7A] hover:bg-[#153A7A]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    console.log("Submit button clicked", {
                      isSubmitting,
                      isPending: updateReportMutation.isPending,
                      hasSelectedActivities,
                      allPhasesCompleted,
                      hasValidEvidenceCount,
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
