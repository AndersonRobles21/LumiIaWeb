export function normalizarHora(hora) {
	return typeof hora === 'string' ? hora.slice(0, 5) : '';
}

export function normalizarHorarios(horarios = []) {
	return horarios.map(horario => ({
		dia: horario.dia,
		hora_inicio: normalizarHora(horario.hora_inicio),
		hora_fin: normalizarHora(horario.hora_fin),
	}));
}

export function validarHorarios(horarios = []) {
	const normalizados = normalizarHorarios(horarios);
	const porDia = new Map();

	for (const horario of normalizados) {
		if (!horario.dia || !/^\d{2}:\d{2}$/.test(horario.hora_inicio) || !/^\d{2}:\d{2}$/.test(horario.hora_fin)) {
			throw new Error('Cada horario debe tener día y horas válidas.');
		}

		const inicio = minutos(horario.hora_inicio);
		const fin = minutos(horario.hora_fin);
		if (inicio >= fin) throw new Error('La hora de inicio debe ser anterior a la hora de fin.');

		const delDia = porDia.get(horario.dia) || [];
		if (delDia.some(actual => inicio < actual.fin && fin > actual.inicio)) {
			throw new Error(`Los horarios de ${horario.dia} no pueden solaparse.`);
		}
		delDia.push({ inicio, fin });
		porDia.set(horario.dia, delDia);
	}

	return normalizados;
}

export function calcularHorasDisponibles(horarios = []) {
	const normalizados = normalizarHorarios(horarios);
	const dias = new Set(normalizados.map(horario => horario.dia));
	if (!dias.size) return 0;
	const minutosTotales = normalizados.reduce((total, horario) => total + minutos(horario.hora_fin) - minutos(horario.hora_inicio), 0);
	return Math.round((minutosTotales / 60) / dias.size);
}

function minutos(hora) {
	const [horas, minutosHora] = hora.split(':').map(Number);
	return horas * 60 + minutosHora;
}
