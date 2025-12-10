import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

export type WorkReportPDFProps = {
    values: {
        subsistema?: string;
        ubicacion?: string;
        fechaHoraInicio?: string;
        turno?: string;
        frecuencia?: string;
        trabajadores?: string[];
        inspeccionRealizada?: boolean;
        observacionesActividad?: string;
        evidenciasCount?: number;
        herramientas?: string[];
        refacciones?: string[];
        observacionesGenerales?: string;
        nombreResponsable?: string;
        fechaHoraTermino?: string;
        firmaResponsable?: string | null;
        folio?: string;
    };
};

const primaryColor = '#153A7A';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#f5f7ff',
        padding: 0,
        fontFamily: 'Helvetica',
    },
    container: {
        backgroundColor: '#f5f7ff',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.1,
        zIndex: -1,
    },
    watermarkText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#9ca3af',
        transform: 'rotate(-25deg)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
    },
    headerLogo: {
        width: 100,
        height: 40,
        objectFit: 'contain',
    },
    headerTextContainer: {
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 10,
        color: primaryColor,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 9,
        color: primaryColor,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        height: 2,
        backgroundColor: primaryColor,
        marginHorizontal: 20,
        marginBottom: 10,
    },
    section: {
        marginHorizontal: 20,
        marginTop: 10,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 5,
    },
    col: {
        flex: 1,
    },
    pillLabel: {
        backgroundColor: primaryColor,
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 2,
    },
    pillValue: {
        borderWidth: 1,
        borderColor: primaryColor,
        color: primaryColor,
        backgroundColor: 'white',
        fontSize: 9,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        minHeight: 20,
    },
    sectionHeader: {
        backgroundColor: primaryColor,
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        textTransform: 'uppercase',
    },
    sectionContent: {
        borderWidth: 1,
        borderColor: primaryColor,
        backgroundColor: 'white',
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        padding: 5,
        minHeight: 20,
    },
    listItem: {
        fontSize: 9,
        color: primaryColor,
        marginBottom: 2,
    },
    emptyText: {
        fontSize: 9,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
});

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const LabeledPill = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.col}>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillValue}>{value && value.trim().length > 0 ? value : '—'}</Text>
    </View>
);

export const WorkReportPDF = ({ values }: WorkReportPDFProps) => {
    const {
        subsistema,
        ubicacion,
        fechaHoraInicio,
        turno,
        frecuencia,
        trabajadores,
        inspeccionRealizada,
        observacionesActividad,
        evidenciasCount,
        herramientas,
        refacciones,
        observacionesGenerales,
        nombreResponsable,
        fechaHoraTermino,
        firmaResponsable,
    } = values;

    const workersString = trabajadores?.map(formatName).join(', ') || '—';

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={styles.container}>
                    {/* Watermark */}
                    <View style={styles.watermarkContainer}>
                        <Text style={styles.watermarkText}>IMA SOLUCIONES</Text>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Image src="/logo-ima.png" style={styles.headerLogo} />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Formato de trabajo proyecto</Text>
                            <Text style={styles.headerSubtitle}>AEROTREN AICM</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* General Data */}
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <LabeledPill label="SUBSISTEMA" value={subsistema} />
                            <LabeledPill label="FECHA Y HORA" value={formatDate(fechaHoraInicio)} />
                        </View>
                        <View style={styles.row}>
                            <LabeledPill label="UBICACIÓN" value={ubicacion} />
                            <LabeledPill label="TURNO" value={turno} />
                        </View>
                        <View style={styles.row}>
                            <LabeledPill label="FRECUENCIA" value={frecuencia} />
                            <LabeledPill label="TRABAJADORES INVOLUCRADOS" value={workersString} />
                        </View>
                    </View>

                    {/* Activity Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>ACTIVIDAD</Text>
                        <View style={styles.sectionContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: primaryColor }}>¿Inspección realizada?</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: primaryColor }}>{inspeccionRealizada ? 'SÍ' : 'NO'}</Text>
                            </View>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#777', marginBottom: 2 }}>OBSERVACIONES</Text>
                            <View style={{ borderWidth: 1, borderColor: '#d0d5ee', padding: 5, minHeight: 30, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, color: primaryColor }}>
                                    {observacionesActividad && observacionesActividad.trim().length > 0 ? observacionesActividad : '—'}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 8, color: '#555', marginTop: 3 }}>
                                Evidencias adjuntas: {evidenciasCount ?? 0} / 5
                            </Text>
                        </View>
                    </View>

                    {/* Tools and Parts */}
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.sectionHeader}>HERRAMIENTAS UTILIZADAS</Text>
                                <View style={[styles.sectionContent, { minHeight: 50 }]}>
                                    {herramientas && herramientas.length > 0 ? (
                                        herramientas.map((tool, idx) => (
                                            <Text key={idx} style={styles.listItem}>• {formatName(tool)}</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>Ninguna</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.sectionHeader}>REFACCIONES UTILIZADAS</Text>
                                <View style={[styles.sectionContent, { minHeight: 50 }]}>
                                    {refacciones && refacciones.length > 0 ? (
                                        refacciones.map((part, idx) => (
                                            <Text key={idx} style={styles.listItem}>• {formatName(part)}</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>Ninguna</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* General Observations */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>OBSERVACIONES GENERALES</Text>
                        <View style={[styles.sectionContent, { minHeight: 50 }]}>
                            <Text style={{ fontSize: 9, color: primaryColor }}>
                                {observacionesGenerales && observacionesGenerales.trim().length > 0 ? observacionesGenerales : '—'}
                            </Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={[styles.section, { marginTop: 'auto', marginBottom: 20 }]}>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={[styles.sectionHeader, { textAlign: 'center' }]}>NOMBRE Y FIRMA DE SUPERVISOR</Text>
                                <View style={[styles.sectionContent, { minHeight: 60, justifyContent: 'space-between' }]}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: primaryColor }}>
                                        {nombreResponsable || '—'}
                                    </Text>
                                    <View style={{ borderTopWidth: 1, borderTopColor: '#999', borderStyle: 'dashed', height: 30, justifyContent: 'flex-end', alignItems: 'center', marginTop: 5 }}>
                                        {firmaResponsable ? (
                                            <Image src={firmaResponsable} style={{ height: 28, objectFit: 'contain' }} />
                                        ) : (
                                            <Text style={{ fontSize: 7, color: '#d1d5db' }}>Sin firma</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                            <View style={styles.col}>
                                <Text style={[styles.sectionHeader, { textAlign: 'center' }]}>FECHA Y HORA DE TÉRMINO</Text>
                                <View style={[styles.sectionContent, { minHeight: 60, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: primaryColor }}>
                                        {fechaHoraTermino ? formatDate(fechaHoraTermino) : '—'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
