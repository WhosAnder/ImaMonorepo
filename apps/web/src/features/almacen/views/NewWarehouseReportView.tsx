"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWarehouseItems } from '@/hooks/useWarehouse';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/Button';
import { SignaturePad } from '@/shared/ui/SignaturePad';
import { ImageUpload } from '@/shared/ui/ImageUpload';
import { WarehouseReportPreview } from '../components/WarehouseReportPreview';
import { warehouseReportSchema, WarehouseReportFormValues } from '../schemas/warehouseReportSchema';
import { createWarehouseReport } from '@/api/reportsClient';
import { Save, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

const SUBSYSTEMS = [
    'EQUIPO DE GUIA/ TRABAJO DE GUIA',
    'VEHICULO',
    'EQUIPO DE PROPULSION',
    'EQUIPO DE CONTROL DE TREN (ATC)',
    'EQUIPO DE COMUNICACION',
    'EQUIPO DE DISTRIBUCION DE POTENCIA DE BAJO VOLTAJE',
    'EQUIPO DE CONTROL CENTRAL Y SCADA',
    'EQUIPO DE ESTACION',
    'EQUIPO DE MANTENIMIENTO',
];

// Shadcn-like components (internal for now as we don't have the full library)
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`w-full rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm ${className}`}>
        {children}
    </div>
);

const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 ${className}`}>
        {children}
    </label>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                className={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div className="relative">
                <select
                    className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none ${className}`}
                    ref={ref}
                    {...props}
                />
                <ChevronsUpDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
        )
    }
)
Select.displayName = "Select"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={`flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"


export const NewWarehouseReportPage: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();

    // Fetch inventory - all active items are available for both sections
    const { data: inventoryItems, isLoading: isLoadingInventory } = useWarehouseItems({ status: 'active' });
    // Note: If categories are added to warehouse items in the future, 
    // you can filter here: inventoryItems?.filter(i => i.category?.toLowerCase() === 'herramientas')
    const inventoryOptions = inventoryItems || [];

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
            subsistema: '',
            fechaHoraEntrega: new Date().toISOString().slice(0, 16),
            turno: '',
            nombreQuienRecibe: '',
            nombreAlmacenista: '',
            nombreQuienEntrega: '',
            herramientas: [],
            refacciones: [],
            observacionesGenerales: '',
        }
    });

    const { fields: toolsFields, append: appendTool, remove: removeTool } = useFieldArray({
        control,
        name: "herramientas"
    });

    const { fields: partsFields, append: appendPart, remove: removePart } = useFieldArray({
        control,
        name: "refacciones"
    });

    // Auto-calculate shift
    const fechaHoraEntrega = watch('fechaHoraEntrega');
    useEffect(() => {
        if (fechaHoraEntrega) {
            const hour = new Date(fechaHoraEntrega).getHours();
            let shift = 'Nocturno';
            if (hour >= 6 && hour < 14) shift = 'Matutino';
            else if (hour >= 14 && hour < 22) shift = 'Vespertino';
            setValue('turno', shift);
        }
    }, [fechaHoraEntrega, setValue]);

    useEffect(() => {
        if (user?.name) {
            setValue('nombreAlmacenista', user.name, { shouldDirty: false, shouldValidate: true });
            setValue('nombreQuienEntrega', user.name, { shouldDirty: false });
        }
    }, [user?.name, setValue]);

    const onSubmit = async (data: WarehouseReportFormValues) => {
        try {
            const almacenistaName = user?.name ?? data.nombreAlmacenista ?? '';
            const quienEntregaName = user?.name ?? data.nombreQuienEntrega ?? almacenistaName;
            // Build payload with required fields for the API
            const payload = {
                ...data,
                nombreAlmacenista: almacenistaName,
                nombreQuienEntrega: quienEntregaName,
                tipoMantenimiento: 'Preventivo', // Default value, could be added to form if needed
            };

            const result = await createWarehouseReport(payload);
            console.log("Warehouse report created:", result);

            // Redirect to reports list on success
            router.push('/almacen');
        } catch (error) {
            console.error("Error creating warehouse report:", error);
            alert(`Error al crear el reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    // Watch values for preview
    const watchedValues = watch();

    return (
        <div className="min-h-screen bg-white pb-12 font-sans text-gray-900">
            <div className="max-w-[1600px] mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Formato de almacén</h1>
                    <p className="text-gray-500 mt-2 text-lg">Llena el formato de almacén para registrar la entrega de materiales.</p>
                </div>

                <div className="flex flex-col gap-8">

                    {/* Form Section */}
                    <div className="w-full">
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">

                            {/* Section 1: Datos Generales */}
                            <Card className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>
                                    <h2 className="text-xl font-semibold text-gray-900">Datos generales</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Label className="mb-2 block">Subsistema</Label>
                                        <Select {...register('subsistema')}>
                                            <option value="">Seleccionar...</option>
                                            {SUBSYSTEMS.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </Select>
                                        {errors.subsistema && <p className="text-red-500 text-xs mt-1">{errors.subsistema.message}</p>}
                                    </div>

                                    <div>
                                        <Label className="mb-2 block">Fecha y hora de inicio</Label>
                                        <Input type="datetime-local" {...register('fechaHoraEntrega')} />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block">Turno</Label>
                                        <Input type="text" {...register('turno')} readOnly className="bg-gray-50 text-gray-500" />
                                    </div>

                                    <div>
                                        <Label className="mb-2 block">Nombre quien recibe</Label>
                                        <Input type="text" {...register('nombreQuienRecibe')} placeholder="Nombre completo" />
                                        {errors.nombreQuienRecibe && <p className="text-red-500 text-xs mt-1">{errors.nombreQuienRecibe.message}</p>}
                                    </div>
                                    <div>
                                        <Label className="mb-2 block">Nombre almacenista</Label>
                                        <Input
                                            type="text"
                                            {...register('nombreAlmacenista')}
                                            placeholder="Nombre completo"
                                            disabled
                                            readOnly
                                            className="bg-gray-50 text-gray-500"
                                        />
                                        {errors.nombreAlmacenista && <p className="text-red-500 text-xs mt-1">{errors.nombreAlmacenista.message}</p>}
                                    </div>
                                </div>
                            </Card>

                            {/* Section 2: Herramientas */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</div>
                                        <h2 className="text-xl font-semibold text-gray-900">Herramientas</h2>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"

                                        onClick={() => appendTool({ id: crypto.randomUUID(), name: '', units: 1, observations: '', evidences: [] })}
                                        className="h-9"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Agregar
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {toolsFields.map((field, index) => (
                                        <div key={field.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 relative group">
                                            <div className="grid grid-cols-12 gap-4">
                                                <div className="col-span-12 md:col-span-5">
                                                    <Label className="mb-1.5 block text-xs text-gray-500">Herramienta</Label>
                                                    <Select {...register(`herramientas.${index}.name`)} className="h-9">
                                                        <option value="">Seleccionar...</option>
                                                        {inventoryOptions.map((item) => (
                                                            <option key={item._id} value={item.name}>
                                                                {item.name} (Stock: {item.quantityOnHand})
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </div>
                                                <div className="col-span-6 md:col-span-2">
                                                    <Label className="mb-1.5 block text-xs text-gray-500">Unidades</Label>
                                                    <Input
                                                        type="number"
                                                        {...register(`herramientas.${index}.units`, { valueAsNumber: true })}
                                                        className="h-9"
                                                        min={1}
                                                    />
                                                </div>
                                                <div className="col-span-6 md:col-span-5">
                                                    <Label className="mb-1.5 block text-xs text-gray-500">Observaciones</Label>
                                                    <Input {...register(`herramientas.${index}.observations`)} className="h-9" placeholder="Opcional" />
                                                </div>

                                                <div className="col-span-12 pt-2">
                                                    <Controller
                                                        name={`herramientas.${index}.evidences`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <ImageUpload label="Evidencias" onChange={field.onChange} maxFiles={3} compact />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeTool(index)}
                                                className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 shadow-sm rounded-full border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {toolsFields.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg text-gray-400 text-sm">
                                            No hay herramientas agregadas
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Section 3: Refacciones */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</div>
                                        <h2 className="text-xl font-semibold text-gray-900">Refacciones</h2>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"

                                        onClick={() => appendPart({ id: crypto.randomUUID(), name: '', units: 1, observations: '', evidences: [] })}
                                        className="h-9"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Agregar
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {partsFields.map((field, index) => (
                                        <div key={field.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 relative group">
                                            <div className="grid grid-cols-12 gap-4">
                                                <div className="col-span-12 md:col-span-5">
                                                    <Label className="mb-1.5 block text-xs text-gray-500">Refacción</Label>
                                                    <Select {...register(`refacciones.${index}.name`)} className="h-9">
                                                        <option value="">Seleccionar...</option>
                                                        {inventoryOptions.map((item) => (
                                                            <option key={item._id} value={item.name}>
                                                                {item.name} (Stock: {item.quantityOnHand})
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </div>
                                                <div className="col-span-6 md:col-span-2">
                                                    <Label className="mb-1.5 block text-xs text-gray-500">Unidades</Label>
                                                    <Input
                                                        type="number"
                                                        {...register(`refacciones.${index}.units`, { valueAsNumber: true })}
                                                        className="h-9"
                                                        min={1}
                                                    />
                                                </div>
                                                <div className="col-span-6 md:col-span-5">
                                                    <Label className="mb-1.5 block text-xs text-gray-500">Observaciones</Label>
                                                    <Input {...register(`refacciones.${index}.observations`)} className="h-9" placeholder="Opcional" />
                                                </div>

                                                <div className="col-span-12 pt-2">
                                                    <Controller
                                                        name={`refacciones.${index}.evidences`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <ImageUpload label="Evidencias" onChange={field.onChange} maxFiles={3} compact />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removePart(index)}
                                                className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 shadow-sm rounded-full border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {partsFields.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg text-gray-400 text-sm">
                                            No hay refacciones agregadas
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Section 4: Cierre y Firmas */}
                            <Card className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">4</div>
                                    <h2 className="text-xl font-semibold text-gray-900">Cierre y Firmas</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <Label className="mb-2 block">Observaciones Generales</Label>
                                        <Textarea
                                            {...register('observacionesGenerales')}
                                            placeholder="Comentarios adicionales sobre la entrega..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-6 pt-4 border-t border-gray-100">
                                        <Card className="p-6">
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-0">Quien Recibe</h3>
                                                <Controller
                                                    name="firmaQuienRecibe"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <SignaturePad label="Firma digital" onChange={field.onChange} />
                                                    )}
                                                />
                                            </div>
                                        </Card>
                                        <Card className="p-6">
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-0">Almacenista</h3>
                                                <Controller
                                                    name="firmaAlmacenista"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <SignaturePad label="Firma digital" onChange={field.onChange} />
                                                    )}
                                                />
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100">
                                        <div className="flex flex-col gap-6">
                                            <div>
                                                <Label className="mb-2 block">Nombre quien entrega</Label>
                                                <Input
                                                    type="text"
                                                    {...register('nombreQuienEntrega')}
                                                    placeholder="Nombre completo"
                                                    disabled
                                                    readOnly
                                                    className="bg-gray-50 text-gray-500"
                                                />
                                            </div>
                                            <Card className="p-6">
                                                <div className="space-y-4">
                                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-0">Firma quien entrega</h3>
                                                    <Controller
                                                        name="firmaQuienEntrega"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <SignaturePad label="Firma digital" onChange={field.onChange} />
                                                        )}
                                                    />
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Submit */}
                            <div className="flex justify-end pt-4">
                                <Button type="submit" isLoading={isSubmitting} className="px-8 py-2.5 h-11 text-base shadow-lg hover:shadow-xl transition-all bg-gray-900 hover:bg-gray-800 text-white rounded-md">
                                    <Save className="w-5 h-5 mr-2" />
                                    Generar Reporte
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Preview Section */}
                    <div className="w-full">
                        <div className="sticky top-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-4 text-sm font-medium text-gray-500">Vista previa del reporte</h3>
                            <WarehouseReportPreview values={watchedValues} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
