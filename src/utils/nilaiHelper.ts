import { NilaiSiswaItem, Siswa } from '../types';

export interface AssessmentCol {
  id: string;
  nama: string;
  jenis: 'formatif' | 'sumatif';
}

export interface StudentGradeRow {
  siswa: Siswa;
  hasScore: boolean;
  hasFormatif: boolean;
  hasSumatif: boolean;
  scoresByCol: Record<string, number | undefined>;
  formatifScores: Record<string, number | undefined>;
  sumatifScores: Record<string, number | undefined>;
  avgF: number | undefined;
  avgS: number | undefined;
  stsVal: number;
  sasVal: number;
  finalScore: number | undefined;
  isPassed: boolean;
}

export interface ClassGradeRecapResult {
  columns: AssessmentCol[];
  formatifCols: AssessmentCol[];
  sumatifCols: AssessmentCol[];
  orderedCols: AssessmentCol[];
  classStudents: Siswa[];
  rows: StudentGradeRow[];
  gradedList: StudentGradeRow[];
  studentsCount: number;
  gradedCount: number;
  classAvg: number;
  passedCount: number;
  remedialCount: number;
  passRate: number;
}

/**
 * Filter records from `nilais` matching the specified class, subject, semester, and teacher.
 */
export function getSavedNilaisForFilter(
  nilais: NilaiSiswaItem[],
  kelas: string,
  mapel: string,
  semester: string,
  guruId?: string
): NilaiSiswaItem[] {
  if (!kelas || !mapel) return [];
  const normKelas = kelas.trim();
  const normMapel = mapel.trim();
  const normSem = (semester || 'Ganjil').trim();

  return nilais.filter(
    (item) =>
      item.kelas?.trim() === normKelas &&
      item.mapel?.trim() === normMapel &&
      (item.semester || 'Ganjil').trim() === normSem &&
      (!item.guruId || !guruId || item.guruId === guruId)
  );
}

/**
 * Single source of truth to resolve active assessment columns for a class, subject, and semester.
 * Guarantees 100% identical column structure in both "Menu Nilai Siswa" and "Menu Rekap & Leger Nilai".
 */
export function resolveAssessmentColumns(
  nilais: NilaiSiswaItem[],
  kelas: string,
  mapel: string,
  semester: string,
  guruId?: string
): AssessmentCol[] {
  if (!kelas || !mapel) return [];

  const savedForClass = getSavedNilaisForFilter(nilais, kelas, mapel, semester, guruId);

  // If no grade records exist in AppContext for this filter, do not display any columns
  if (savedForClass.length === 0) {
    return [];
  }

  // Collect all customScores keys actually present in the saved records
  const customScoreKeys = new Set<string>();
  savedForClass.forEach((item) => {
    if (item.customScores && typeof item.customScores === 'object') {
      Object.keys(item.customScores).forEach((k) => {
        if (k) customScoreKeys.add(k);
      });
    }
  });

  // Collect known column metadata (id -> AssessmentCol) from localStorage and saved records
  const knownColsMap = new Map<string, AssessmentCol>();
  const orderedCandidateIds: string[] = [];

  const addCandidateCol = (col: any) => {
    if (!col || typeof col.id !== 'string' || !col.id) return;
    const jenis: 'formatif' | 'sumatif' = col.jenis === 'sumatif' ? 'sumatif' : 'formatif';
    const nama = typeof col.nama === 'string' ? col.nama : col.id;
    knownColsMap.set(col.id, { id: col.id, nama, jenis });
    if (!orderedCandidateIds.includes(col.id)) {
      orderedCandidateIds.push(col.id);
    }
  };

  // 1. Check assessmentCols stored directly on the saved nilais records (most authoritative)
  for (let i = savedForClass.length - 1; i >= 0; i--) {
    const rec = savedForClass[i];
    if (Array.isArray(rec.assessmentCols) && rec.assessmentCols.length > 0) {
      rec.assessmentCols.forEach(addCandidateCol);
      break;
    }
  }

  // 2. Check localStorage for column labels/metadata for this specific class, mapel, semester
  const activeKey = `nilai_cols_${kelas.trim()}_${mapel.trim()}_${(semester || 'Ganjil').trim()}`;
  try {
    const raw = localStorage.getItem(activeKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((c) => {
          if (c && c.id && !knownColsMap.has(c.id)) {
            addCandidateCol(c);
          } else if (c && c.id && knownColsMap.has(c.id) && typeof c.nama === 'string') {
            // Preserve custom label if present
            const existing = knownColsMap.get(c.id)!;
            knownColsMap.set(c.id, { ...existing, nama: c.nama });
          }
        });
      }
    }
  } catch {
    // ignore storage read errors
  }

  // Case A: Records use customScores (modern format)
  if (customScoreKeys.size > 0) {
    const formatifCols: AssessmentCol[] = [];
    const sumatifCols: AssessmentCol[] = [];
    const includedIds = new Set<string>();

    // First add columns in their configured order, provided they exist in customScoreKeys
    orderedCandidateIds.forEach((id) => {
      if (customScoreKeys.has(id) && !includedIds.has(id)) {
        const col = knownColsMap.get(id)!;
        includedIds.add(id);
        if (col.jenis === 'sumatif') {
          sumatifCols.push(col);
        } else {
          formatifCols.push(col);
        }
      }
    });

    // Next, add any customScoreKeys that were not in knownColsMap (e.g. synced from Supabase without localStorage)
    customScoreKeys.forEach((k) => {
      if (!includedIds.has(k)) {
        includedIds.add(k);
        const lower = k.toLowerCase();
        if (lower.startsWith('sumatif') || lower.startsWith('sts') || lower.startsWith('sas')) {
          const label = k.startsWith('sumatif_') ? `Sumatif ${sumatifCols.length + 1}` : k.toUpperCase();
          sumatifCols.push({ id: k, nama: label, jenis: 'sumatif' });
        } else {
          const label = k.startsWith('formatif_') ? `Formatif ${formatifCols.length + 1}` : k.toUpperCase();
          formatifCols.push({ id: k, nama: label, jenis: 'formatif' });
        }
      }
    });

    const resolved = [...formatifCols, ...sumatifCols];

    // Keep localStorage synced with the resolved columns so there is never stale column drift
    try {
      if (resolved.length > 0) {
        localStorage.setItem(activeKey, JSON.stringify(resolved));
      }
    } catch {
      // ignore
    }

    return resolved;
  }

  // Case B: Legacy records without customScores (only include columns with actual values > 0)
  const legacyFormatif: AssessmentCol[] = [];
  const legacySumatif: AssessmentCol[] = [];
  const seenLegacy = new Set<string>();

  savedForClass.forEach((item) => {
    if (typeof item.formatif1 === 'number' && item.formatif1 > 0 && !seenLegacy.has('formatif1')) {
      seenLegacy.add('formatif1');
      legacyFormatif.push({ id: 'formatif1', nama: 'Formatif 1 (TP 1)', jenis: 'formatif' });
    }
    if (typeof item.formatif2 === 'number' && item.formatif2 > 0 && !seenLegacy.has('formatif2')) {
      seenLegacy.add('formatif2');
      legacyFormatif.push({ id: 'formatif2', nama: 'Formatif 2 (TP 2)', jenis: 'formatif' });
    }
    if (typeof item.formatif3 === 'number' && item.formatif3 > 0 && !seenLegacy.has('formatif3')) {
      seenLegacy.add('formatif3');
      legacyFormatif.push({ id: 'formatif3', nama: 'Formatif 3 (TP 3)', jenis: 'formatif' });
    }
    if (typeof item.sts === 'number' && item.sts > 0 && !seenLegacy.has('sts')) {
      seenLegacy.add('sts');
      legacySumatif.push({ id: 'sts', nama: 'STS', jenis: 'sumatif' });
    }
    if (typeof item.sas === 'number' && item.sas > 0 && !seenLegacy.has('sas')) {
      seenLegacy.add('sas');
      legacySumatif.push({ id: 'sas', nama: 'SAS', jenis: 'sumatif' });
    }
  });

  return [...legacyFormatif, ...legacySumatif];
}

/**
 * Single source of truth to compute student grades, averages, and class statistics.
 * Used by BOTH "Menu Nilai Siswa" and "Menu Rekap & Leger Nilai".
 */
export function computeClassGradeRecap(params: {
  siswas: Siswa[];
  nilais: NilaiSiswaItem[];
  kelas: string;
  mapel: string;
  semester: string;
  guruId?: string;
  kkm: number;
  columnsOverride?: AssessmentCol[];
  studentScoresOverride?: Record<string, Record<string, number>>;
}): ClassGradeRecapResult {
  const {
    siswas,
    nilais,
    kelas,
    mapel,
    semester,
    guruId,
    kkm,
    columnsOverride,
    studentScoresOverride
  } = params;

  const classStudents = kelas
    ? siswas
        .filter((s) => s.kelas?.trim() === kelas.trim())
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
    : [];

  const columns =
    columnsOverride !== undefined
      ? columnsOverride
      : resolveAssessmentColumns(nilais, kelas, mapel, semester, guruId);

  const formatifCols = columns.filter((c) => c.jenis === 'formatif');
  const sumatifCols = columns.filter((c) => c.jenis === 'sumatif');
  const orderedCols = [...formatifCols, ...sumatifCols];

  const savedForClass = getSavedNilaisForFilter(nilais, kelas, mapel, semester, guruId);

  const rows: StudentGradeRow[] = classStudents.map((siswa) => {
    // Take the latest record for this student if multiple exist
    let n: NilaiSiswaItem | undefined = undefined;
    for (let i = savedForClass.length - 1; i >= 0; i--) {
      if (savedForClass[i].siswaId === siswa.id) {
        n = savedForClass[i];
        break;
      }
    }

    const overrideRow = studentScoresOverride ? studentScoresOverride[siswa.id] : undefined;

    const scoresByCol: Record<string, number | undefined> = {};
    const formatifScores: Record<string, number | undefined> = {};
    const sumatifScores: Record<string, number | undefined> = {};

    formatifCols.forEach((col) => {
      let val: number | undefined = undefined;
      if (overrideRow && overrideRow[col.id] !== undefined) {
        val = typeof overrideRow[col.id] === 'number' ? overrideRow[col.id] : undefined;
      } else if (n) {
        if (n.customScores && Object.keys(n.customScores).length > 0) {
          if (n.customScores[col.id] !== undefined && n.customScores[col.id] !== null) {
            val = Number(n.customScores[col.id]);
          }
        } else {
          if (col.id === 'formatif1' && typeof n.formatif1 === 'number') val = n.formatif1;
          else if (col.id === 'formatif2' && typeof n.formatif2 === 'number') val = n.formatif2;
          else if (col.id === 'formatif3' && typeof n.formatif3 === 'number') val = n.formatif3;
        }
      }
      formatifScores[col.id] = val;
      scoresByCol[col.id] = val;
    });

    sumatifCols.forEach((col, sIdx) => {
      let val: number | undefined = undefined;
      if (overrideRow && overrideRow[col.id] !== undefined) {
        val = typeof overrideRow[col.id] === 'number' ? overrideRow[col.id] : undefined;
      } else if (n) {
        if (n.customScores && Object.keys(n.customScores).length > 0) {
          if (n.customScores[col.id] !== undefined && n.customScores[col.id] !== null) {
            val = Number(n.customScores[col.id]);
          }
        } else {
          if ((col.id === 'sts' || sIdx === 0) && typeof n.sts === 'number') val = n.sts;
          else if ((col.id === 'sas' || sIdx === 1) && typeof n.sas === 'number') val = n.sas;
        }
      }
      sumatifScores[col.id] = val;
      scoresByCol[col.id] = val;
    });

    const fVals = Object.values(formatifScores).filter((v): v is number => typeof v === 'number' && !isNaN(v) && v >= 0);
    const sVals = Object.values(sumatifScores).filter((v): v is number => typeof v === 'number' && !isNaN(v) && v >= 0);
    const hasFormatif = fVals.length > 0;
    const hasSumatif = sVals.length > 0;
    const hasScore = hasFormatif || hasSumatif;

    if (!hasScore) {
      return {
        siswa,
        hasScore: false,
        hasFormatif: false,
        hasSumatif: false,
        scoresByCol,
        formatifScores,
        sumatifScores,
        avgF: undefined,
        avgS: undefined,
        stsVal: 0,
        sasVal: 0,
        finalScore: undefined,
        isPassed: false
      };
    }

    const avgF = hasFormatif ? Math.round(fVals.reduce((a, b) => a + b, 0) / fVals.length) : undefined;
    const avgS = hasSumatif ? Math.round(sVals.reduce((a, b) => a + b, 0) / sVals.length) : undefined;
    const stsVal = sVals[0] ?? 0;
    const sasVal = sVals[1] ?? 0;

    // Nilai akhir: (rata-rata formatif + rata-rata sumatif) / 2
    let finalScore: number | undefined = undefined;
    if (avgF !== undefined && avgS !== undefined) {
      finalScore = Math.round((avgF + avgS) / 2);
    } else if (avgF !== undefined) {
      finalScore = avgF;
    } else if (avgS !== undefined) {
      finalScore = avgS;
    }

    return {
      siswa,
      hasScore: true,
      hasFormatif,
      hasSumatif,
      scoresByCol,
      formatifScores,
      sumatifScores,
      avgF,
      avgS,
      stsVal,
      sasVal,
      finalScore,
      isPassed: finalScore !== undefined ? finalScore >= kkm : false
    };
  });

  // Always maintain A-Z student name order
  rows.sort((a, b) => a.siswa.nama.localeCompare(b.siswa.nama, 'id'));

  const gradedList = rows.filter((r) => r.hasScore && r.finalScore !== undefined);
  const studentsCount = classStudents.length;
  const gradedCount = gradedList.length;
  const classAvg =
    gradedCount > 0 ? Math.round(gradedList.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) / gradedCount) : 0;
  const passedCount = gradedList.filter((r) => r.isPassed).length;
  const remedialCount = gradedCount - passedCount;
  const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;

  return {
    columns,
    formatifCols,
    sumatifCols,
    orderedCols,
    classStudents,
    rows,
    gradedList,
    studentsCount,
    gradedCount,
    classAvg,
    passedCount,
    remedialCount,
    passRate
  };
}
