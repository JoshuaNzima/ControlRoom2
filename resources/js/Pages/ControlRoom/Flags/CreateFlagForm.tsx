import React from 'react';
import { useForm } from '@inertiajs/react';
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';

interface Props {
	onClose: () => void;
}

const CreateFlagForm: React.FC<Props> = ({ onClose }) => {
	const { data, setData, post, processing, errors } = useForm({
		flaggable_type: '',
		flaggable_id: '',
		reason: '',
		details: '',
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		post(route('control-room.flags.store'), {
			onSuccess: () => {
				onClose();
			},
		});
	};

	return (
		<DialogContent className="sm:max-w-[525px]">
			<DialogHeader>
				<DialogTitle>Create New Flag</DialogTitle>
			</DialogHeader>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="flaggable_type">Type</Label>
						<Select
							value={data.flaggable_type}
							onValueChange={value => setData('flaggable_type', value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="guard">Guard</SelectItem>
								<SelectItem value="user">User</SelectItem>
							</SelectContent>
						</Select>
						{errors.flaggable_type && (
							<p className="text-sm text-red-500">{errors.flaggable_type}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="flaggable_id">ID</Label>
						<Input
							id="flaggable_id"
							type="number"
							value={data.flaggable_id}
							onChange={e => setData('flaggable_id', e.target.value)}
							placeholder="Enter ID"
							// @ts-ignore - input component may accept error prop
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="reason">Reason</Label>
					<Input
						id="reason"
						value={data.reason}
						onChange={e => setData('reason', e.target.value)}
						placeholder="Brief reason for flagging"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="details">Details</Label>
					<Textarea
						id="details"
						value={data.details}
						onChange={e => setData('details', e.target.value)}
						placeholder="Provide detailed explanation"
						rows={4}
					/>
				</div>

				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={onClose} type="button">
						Cancel
					</Button>
					<Button type="submit" disabled={processing}>
						Create Flag
					</Button>
				</div>
			</form>
		</DialogContent>
	);
};

export default CreateFlagForm;
