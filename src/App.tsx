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
  rango?: {
    min: string;
    max: string;
    minSemana: number;
    minDias: number;
    maxSemana: number;
    maxDias: number;
  };
}

// Función para formatear una fecha en YYYY-MM-DD
const formatearFecha = (fecha: Date): string => {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
};

// Función para crear un festivo específico
const crearFestivo = (año: number, mes: number, dia: number): string => {
  const fecha = new Date(año, mes - 1, dia);
  return formatearFecha(fecha);
};

// Lista de festivos para un año específico
const calcularFestivos = (año: number): string[] => {
  // Cálculo de Pascua (Algoritmo de Meeus/Jones/Butcher)
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

  const pascua = calcularPascua(año);
  
  // Jueves y Viernes Santo
  const juevesSanto = new Date(pascua);
  juevesSanto.setDate(pascua.getDate() - 3);
  
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);

  const festivos = [
    crearFestivo(año, 1, 1),   // Año Nuevo
    crearFestivo(año, 1, 6),   // Reyes
    formatearFecha(juevesSanto),    // Jueves Santo
    formatearFecha(viernesSanto),   // Viernes Santo
    crearFestivo(año, 5, 1),   // Día del Trabajo
    crearFestivo(año, 8, 15),  // Asunción
    crearFestivo(año, 10, 12), // Fiesta Nacional
    crearFestivo(año, 11, 1),  // Todos los Santos
    crearFestivo(año, 12, 6),  // Constitución
    crearFestivo(año, 12, 8),  // Inmaculada
    crearFestivo(año, 12, 25), // Navidad
  ];

  console.log(`Festivos generados para ${año}:`, festivos);
  return festivos;
};

// Generar lista completa de festivos
const VACATION_DATES = (() => {
  const añoActual = new Date().getFullYear();
  const añoSiguiente = añoActual + 1;
  const todosLosFestivos = [...calcularFestivos(añoActual), ...calcularFestivos(añoSiguiente)];
  console.log('Lista completa de festivos:', todosLosFestivos);
  return todosLosFestivos;
})();

const CalculadoraRevisiones: React.FC = () => {
  const [fur, setFur] = useState<string>('');
  const [revisiones, setRevisiones] = useState<Revision[]>([]);
  const [error, setError] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(12, 0, 0, 0);
    return date;
  };

  const isVacation = (date: Date): boolean => {
    const dateStr = formatearFecha(date);
    console.log('Verificando festivo:', dateStr, 'Lista:', VACATION_DATES);
    const result = VACATION_DATES.includes(dateStr);
    console.log('¿Es festivo?:', result);
    return result;
  };

  const siguienteDiaHabil = (fecha: Date): Date => {
    console.log('======= Buscando siguiente día hábil =======');
    console.log('Fecha inicial:', formatearFecha(fecha));
    
    let currentDate = new Date(fecha.getTime());
    while (
      currentDate.getDay() === 0 || // Domingo
      currentDate.getDay() === 6 || // Sábado
      isVacation(currentDate)       // Festivo
    ) {
      currentDate.setDate(currentDate.getDate() + 1);
      console.log('Avanzando a:', formatearFecha(currentDate));
    }
    
    console.log('Día hábil encontrado:', formatearFecha(currentDate));
    return currentDate;
  };

  const calcularRevisiones = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('=============== Iniciando cálculo de revisiones ===============');
    e.preventDefault();
    setError('');
  
    try {
      const furDate = parseDate(fur);
      console.log('FUR seleccionada:', formatearFecha(furDate));
      
      const revisiones: Array<[number, string, { minSemana?: number; minDias?: number; maxSemana?: number; maxDias?: number }]> = [
        [8, "Nueva obstétrica + ecografía + consulta de matrona", {}],
        [12, "Revisión obstetricia + ecografía semana 12 + screening primer trimestre + screening preeclampsia", 
            { minSemana: 11, minDias: 2, maxSemana: 13, maxDias: 6 }],
        [16, "Consulta de matrona", {}],
        [20, "Revisión obstetricia + ecografía semana 20", 
            { minSemana: 19, minDias: 0, maxSemana: 22, maxDias: 6 }],
        [26, "Revisión obstetricia + ecografía obstétrica + analítica de segundo trimestre", 
            { minSemana: 25, minDias: 0, maxSemana: 27, maxDias: 0 }],
        [32, "Consulta de matrona", {}],
        [36, "Revisión obstetricia + ecografía obstétrica + analítica de tercer trimestre + anestesia + consulta de matrona", 
            { minSemana: 36, minDias: 0, maxSemana: 37, maxDias: 0 }],
        [39, "Monitorización", {}],
        [40, "Revisión obstetricia + ecografía obstétrica + monitorización", {}]
      ];
  
      const calculadas = revisiones.map(([semanas, descripcion, rango]) => {
        console.log('\n------- Calculando revisión semana', semanas, '-------');
        
        const fechaBase = new Date(furDate.getTime());
        fechaBase.setDate(fechaBase.getDate() + (semanas * 7));
        console.log('Fecha base calculada:', formatearFecha(fechaBase));
        
        const fechaFinal = siguienteDiaHabil(fechaBase);
        console.log('Fecha final ajustada:', formatearFecha(fechaFinal));

        // Calcular fechas límite si existen rangos
        let fechaMinima = null;
        let fechaMaxima = null;
        if (rango.minSemana !== undefined) {
          fechaMinima = new Date(furDate.getTime());
          const diasMinimos = (rango.minSemana * 7) + (rango.minDias || 0);
          fechaMinima.setDate(fechaMinima.getDate() + diasMinimos);
          
          fechaMaxima = new Date(furDate.getTime());
        
          const diasMaximos = ((rango.maxSemana ?? 0) * 7) + (rango.maxDias || 0);
          fechaMaxima.setDate(fechaMaxima.getDate() + diasMaximos);
          
        }
        
        return {
          semana: semanas,
          fecha: formatearFecha(fechaFinal),
          descripcion,
          rango: rango.minSemana !== undefined ? {
            min: formatearFecha(fechaMinima!),
            max: formatearFecha(fechaMaxima!),
            minSemana: rango.minSemana,
            minDias: rango.minDias || 0,
            maxSemana: rango.maxSemana!,
            maxDias: rango.maxDias || 0
          } : undefined
        };
      });
  
      setRevisiones(calculadas);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al calcular las revisiones. Por favor, verifica la fecha.');
    }
  };

  const downloadPDF = async (): Promise<void> => {
    if (!contentRef.current) return;
  
    try {
      // Configuración del elemento a capturar
      const element = contentRef.current;
      const originalPadding = element.style.padding;
      element.style.padding = '20px'; // Añadir padding temporal
  
      // Crear el canvas con mejor calidad y escala
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Puedes manipular el DOM clonado aquí si es necesario
          const clonedElement = clonedDoc.querySelector('.max-w-4xl') as HTMLElement | null;
          if (clonedElement) {
            clonedElement.style.padding = '20px';
          }
          
        }
      });
  
      // Restaurar el padding original
      element.style.padding = originalPadding;
  
      // Obtener los datos de la imagen
      const imgData = canvas.toDataURL('image/png', 1.0);
  
      // Crear el PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
  
      // Obtener dimensiones
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
  
      // Calcular dimensiones y ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(
        (pdfWidth - 40) / imgWidth, // 20mm margen a cada lado
        (pdfHeight - 40) / imgHeight // 20mm margen arriba y abajo
      );
  
      // Calcular dimensiones finales
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
  
      // Calcular posición centrada
      const x = (pdfWidth - finalWidth) / 2;
      const y = 20; // Margen superior fijo de 20mm
  
      // Calcular número de páginas necesarias
      const pageHeight = pdfHeight - 40; // Altura útil de página (con márgenes)
      const pageCount = Math.ceil(finalHeight / pageHeight);
  
      // Añadir contenido a las páginas
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }
  
        // Calcular la porción de imagen a mostrar en esta página
  
        pdf.addImage(
          imgData, // Data URI de la imagen
          'PNG',   // Formato de imagen
          x,       // Coordenada x
          y,       // Coordenada y
          finalWidth, // Ancho de la imagen
          finalHeight, // Altura de la imagen
          undefined, // Nombre opcional
          'FAST'  // Método de renderizado
        );
        
  
        // Añadir número de página
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Página ${i + 1} de ${pageCount}`,
          pdfWidth / 2,
          pdfHeight - 10,
          { align: 'center' }
        );
      }
  
      // Guardar el PDF
      pdf.save('calendario-revisiones.pdf');
  
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div ref={contentRef} className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
  <Baby className="w-8 h-8 sm:w-6 sm:h-6 text-purple-600" />
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-800 text-center sm:text-left">
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
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-purple-900 text-lg mb-1">
                              {format(new Date(revision.fecha), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                            </p>
                            <p className="text-gray-600">{revision.descripcion}</p>
                          </div>
                          {revision.rango && (
                            <div className="ml-4 text-sm bg-purple-50 p-3 rounded-lg border border-purple-100">
                              <p className="font-medium text-purple-800 mb-1">Rango permitido:</p>
                              <p className="text-purple-700">
                                Semana {revision.rango.minSemana}
                                {revision.rango.minDias > 0 ? `+${revision.rango.minDias}` : ''} a {' '}
                                Semana {revision.rango.maxSemana}
                                {revision.rango.maxDias > 0 ? `+${revision.rango.maxDias}` : ''}
                              </p>
                              <div className="mt-1 text-gray-600">
                                <p>Desde: {format(new Date(revision.rango.min), "d 'de' MMMM", { locale: es })}</p>
                                <p>Hasta: {format(new Date(revision.rango.max), "d 'de' MMMM", { locale: es })}</p>
                              </div>
                            </div>
                          )}
                        </div>
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