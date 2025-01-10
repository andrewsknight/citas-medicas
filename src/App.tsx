import React, { useState, useRef } from 'react';
import { Calendar, Download, Baby, Clock, Calendar as CalendarIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Revision {
  semana: number;
  fecha: string;
  descripcion: string;
}

const calcularFestivos = (año: number): string[] => {
  const calcularPascua = (año: number): Date => {
    const a = año % 19;
    const b = Math.floor(año / 100);
    const c = año % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(año, mes - 1, dia);
  };

  const formatearFecha = (fecha: Date): string => {
    return fecha.toISOString().split('T')[0];
  };

  const pascua = calcularPascua(año);
  
  const juevesSanto = new Date(pascua);
  juevesSanto.setDate(pascua.getDate() - 3);
  
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);

  const festivos = [
    new Date(año, 0, 1),   // 1 de enero
    new Date(año, 0, 6),   // 6 de enero
    juevesSanto,           // Jueves Santo
    viernesSanto,          // Viernes Santo
    new Date(año, 4, 1),   // 1 de mayo
    new Date(año, 7, 15),  // 15 de agosto
    new Date(año, 9, 12),  // 12 de octubre
    new Date(año, 10, 1),  // 1 de noviembre
    new Date(año, 11, 6),  // 6 de diciembre
    new Date(año, 11, 8),  // 8 de diciembre
    new Date(año, 11, 25), // 25 de diciembre
  ];

  return festivos.map(fecha => formatearFecha(fecha));
};

const VACATION_DATES = (() => {
  const añoActual = new Date().getFullYear();
  const añoSiguiente = añoActual + 1;
  return [...calcularFestivos(añoActual), ...calcularFestivos(añoSiguiente)];
})();

const CalculadoraRevisiones: React.FC = () => {
  const [fur, setFur] = useState<string>('');
  const [revisiones, setRevisiones] = useState<Revision[]>([]);
  const [error, setError] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isVacation = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return VACATION_DATES.includes(dateStr);
  };

  const siguienteDiaHabil = (fecha: Date): Date => {
    let currentDate = new Date(fecha);
    while (
      currentDate.getDay() === 0 ||
      currentDate.getDay() === 6 ||
      isVacation(currentDate)
    ) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return currentDate;
  };

  const calcularRevisiones = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const furDate = parseDate(fur);
      
      const revisiones: [number, string][] = [
        [8, "Nueva obstétrica + ecografía + consulta de matrona"],
        [12, "Revisión obstetricia + ecografía semana 12 + screening primer trimestre + screening preeclampsia"],
        [16, "Consulta de matrona"],
        [20, "Revisión obstetricia + ecografía semana 20"],
        [26, "Revisión obstetricia + ecografía obstétrica + analítica de segundo trimestre"],
        [32, "Consulta de matrona"],
        [36, "Revisión obstetricia + ecografía obstétrica + analítica de tercer trimestre + anestesia + consulta de matrona"],
        [39, "Monitorización"],
        [40, "Revisión obstetricia + ecografía obstétrica + monitorización"]
      ];

      const calculadas = revisiones.map(([semanas, descripcion]) => {
        const fechaRevision = new Date(furDate);
        fechaRevision.setDate(fechaRevision.getDate() + (semanas * 7));
        const fechaHabil = siguienteDiaHabil(fechaRevision);
        
        return {
          semana: semanas,
          fecha: formatDate(fechaHabil),
          descripcion
        };
      });

      setRevisiones(calculadas);
    } catch (err) {
      setError('Error al calcular las revisiones. Por favor, verifica la fecha.');
    }
  };

  const downloadPDF = async (): Promise<void> => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('calendario-revisiones.pdf');
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div ref={contentRef} className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Baby className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-purple-800">
              Calculadora de Revisiones Obstétricas
            </h1>
          </div>

          <form onSubmit={calcularRevisiones} className="mb-10">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-purple-600" />
                  Fecha de Última Regla (FUR)
                </label>
                <input
                  type="date"
                  value={fur}
                  onChange={(e) => setFur(e.target.value)}
                  className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-800 bg-white"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Clock className="w-5 h-5" />
                  Calcular
                </button>
                {revisiones.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadPDF}
                    className="bg-purple-100 text-purple-700 px-6 py-3 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Descargar PDF
                  </button>
                )}
              </div>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {revisiones.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Calendario de Revisiones
              </h2>
              <div className="grid gap-4">
                {revisiones.map((revision, index) => (
                  <div
                    key={index}
                    className="bg-white border border-purple-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                        <span className="text-purple-700 font-bold text-lg">S{revision.semana}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900 text-lg mb-1">
                          {format(new Date(revision.fecha), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                        <p className="text-gray-600">{revision.descripcion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculadoraRevisiones;