import React from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import Select from '@/Components/Select';
import { Textarea } from '@/Components/ui/textarea';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import DatePicker from '@/Components/DatePicker';

type Guard = { id: number | string; name?: string };
type Site = { id: number | string; name?: string };
type Shift = any;

interface Props {
	shift?: Shift | null;
	guards?: Guard[];
	sites?: Site[];
	className?: string;
}

const ShiftForm: React.FC<Props> = ({ shift = null, guards = [], sites = [], className = '' }) => {
	// useForm can have complex inferred types; keep as any to avoid excessive instantiation
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { data, setData, post, put, processing, errors }: any = useForm({
		guard_id: shift?.guard_id || '',
		client_site_id: shift?.client_site_id || '',
		date: shift?.date || '',
		start_time: shift?.start_time ? new Date(shift.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '',
		end_time: shift?.end_time ? new Date(shift.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '',
		shift_type: shift?.shift_type || 'day',
		instructions: shift?.instructions || '',
		status: shift?.status || 'scheduled',
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (shift) {
			put(route('shifts.update', shift.id));
		} else {
			post(route('shifts.store'));
		}
	};

	return (
		<form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
			<div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
				<div>
					<Select
						label="Guard"
						name="guard_id"
						value={data.guard_id}
						onChange={e => setData('guard_id', e.target.value)}
						required
					>
						<option value="">Select a guard</option>
						{guards.map(guard => (
							<option key={guard.id} value={guard.id}>{guard.name}</option>
						))}
					</Select>
					<InputError message={errors.guard_id} />
				</div>

				<div>
					<Select
						label="Site"
						name="client_site_id"
						value={data.client_site_id}
						onChange={e => setData('client_site_id', e.target.value)}
						required
					>
						<option value="">Select a site</option>
						{sites.map(site => (
							<option key={site.id} value={site.id}>{site.name}</option>
						))}
					</Select>
					<InputError message={errors.client_site_id} />
				</div>

				<div>
					<DatePicker
						label="Date"
						selected={data.date ? new Date(data.date) : null}
						onChange={date => setData('date', date)}
						required
						className="w-full"
					/>
					<InputError message={errors.date} />
				</div>

				<div>
					<Select
						label="Shift Type"
						name="shift_type"
						value={data.shift_type}
						onChange={e => setData('shift_type', e.target.value)}
						required
					>
						<option value="day">Day Shift</option>
						<option value="night">Night Shift</option>
					</Select>
					<InputError message={errors.shift_type} />
				</div>

				<div>
					<Input
						type="time"
						name="start_time"
						value={data.start_time}
						onChange={e => setData('start_time', e.target.value)}
						required
					/>
					<InputError message={errors.start_time} />
				</div>

				<div>
					<Input
						type="time"
						name="end_time"
						value={data.end_time}
						onChange={e => setData('end_time', e.target.value)}
						required
					/>
					<InputError message={errors.end_time} />
				</div>

				<div>
					<Select
						label="Status"
						name="status"
						value={data.status}
						onChange={e => setData('status', e.target.value)}
						required
					>
						<option value="scheduled">Scheduled</option>
						<option value="completed">Completed</option>
						<option value="cancelled">Cancelled</option>
					</Select>
					<InputError message={errors.status} />
				</div>
			</div>

			<div>
				<Textarea
					name="instructions"
					value={data.instructions}
					onChange={e => setData('instructions', e.target.value)}
					rows={4}
				/>
				<InputError message={errors.instructions} />
			</div>

			<div className="flex justify-end">
				<PrimaryButton type="submit" disabled={processing}>
					{shift ? 'Update Shift' : 'Create Shift'}
				</PrimaryButton>
			</div>
		</form>
	);
};

export default ShiftForm;
