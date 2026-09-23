import React from 'react';
import { useApp } from '../../context/AppContext';
import { School } from 'lucide-react';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  showOnScreen?: boolean;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ title, subtitle, showOnScreen = false }) => {
  const { schoolSettings } = useApp();

  return (
    <div className={`${showOnScreen ? 'block' : 'hidden print:block print-only'} mb-6 border-b-2 border-slate-900 pb-3 text-slate-900`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-slate-800 bg-slate-100 font-bold text-slate-800 overflow-hidden p-1">
            {schoolSettings.logoUrl ? (
              <img
                src={schoolSettings.logoUrl}
                alt={schoolSettings.schoolName}
                className="h-full w-full object-contain"
              />
            ) : (
              <School className="h-10 w-10 text-emerald-700" />
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-600 font-medium">Pemerintah Provinsi / Dinas Pendidikan</p>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">{schoolSettings.schoolName}</h1>
            <p className="text-xs text-slate-600">
              NPSN: {schoolSettings.npsn} | {schoolSettings.address}
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold text-slate-800">BUKU ADMINISTRASI GURU</p>
          <p className="text-slate-600">T.A. {schoolSettings.academicYear} ({schoolSettings.activeSemester})</p>
          <p className="text-slate-600">{schoolSettings.curriculum}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-400 pt-2 text-center">
        <h2 className="text-base font-bold uppercase tracking-wide text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs font-medium text-slate-600">{subtitle}</p>}
      </div>
    </div>
  );
};

export const PrintSignatures: React.FC<{
  teacherName?: string;
  teacherNip?: string;
  showOnScreen?: boolean;
}> = ({
  teacherName,
  teacherNip,
  showOnScreen = false
}) => {
  const { schoolSettings, currentTeacher } = useApp();
  const name = teacherName || `${currentTeacher?.nama}, ${currentTeacher?.gelar}`;
  const nip = teacherNip || currentTeacher?.nip || '-';

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={`${showOnScreen ? 'block' : 'hidden print:block print-only'} mt-10 text-xs text-slate-900`}>
      <div className="grid grid-cols-2 gap-8 text-center">
        <div>
          <p className="mb-1">Mengetahui,</p>
          <p className="font-semibold">Kepala {schoolSettings.schoolName}</p>
          <div className="h-20" />
          <p className="font-bold underline">{schoolSettings.headmasterName}</p>
          <p>NIP. {schoolSettings.headmasterNip}</p>
        </div>
        <div>
          <p className="mb-1">Kota Madani, {today}</p>
          <p className="font-semibold">Guru Mata Pelajaran</p>
          <div className="h-20" />
          <p className="font-bold underline">{name}</p>
          <p>NIP. {nip}</p>
        </div>
      </div>
    </div>
  );
};
