import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from '@/Components/ui/form';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/Components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/Components/ui/popover';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Checkbox } from '@/Components/ui/checkbox';

export type Agent = { id: number | string; name?: string; status?: string };

interface Props {
  onClose: () => void;
  agents?: Agent[];
}

const NewConversationForm: React.FC<Props> = ({ onClose, agents = [] }) => {
  const { data, setData, post, processing, errors } = useForm<{ type: string; title?: string; participants: Array<string | number>; is_emergency?: boolean }>({
    type: 'direct',
    title: '',
    participants: [],
    is_emergency: false,
  });

  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('messages.conversations.store'), {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Form>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField>
          <FormLabel>Conversation Type</FormLabel>
          <FormControl>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={data.type === 'direct' ? 'default' : 'outline'}
                onClick={() => setData('type', 'direct')}
              >
                Direct Message
              </Button>
              <Button
                type="button"
                variant={data.type === 'group' ? 'default' : 'outline'}
                onClick={() => setData('type', 'group')}
              >
                Group Chat
              </Button>
            </div>
          </FormControl>
        </FormField>

        {data.type === 'group' && (
          <FormField>
            <FormLabel>Group Title</FormLabel>
            <FormControl>
              <Input
                value={data.title}
                onChange={e => setData('title', e.target.value)}
                placeholder="Enter group title"
              />
            </FormControl>
            {errors.title && <FormMessage>{errors.title}</FormMessage>}
          </FormField>
        )}

        <FormField>
          <FormLabel>Select Participants</FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {data.participants.length > 0
                    ? `${data.participants.length} participants selected`
                    : 'Select participants'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {agents.map((agent) => (
                        <CommandItem
                          key={agent.id}
                          onSelect={() => {
                            const participants: Array<string | number> = (data.participants || []).includes(agent.id)
                              ? (data.participants || []).filter((id: string | number) => id !== agent.id)
                              : [...(data.participants || []), agent.id];
                            setData('participants', participants);
                          }}
                        >
                          <Checkbox
                            checked={(data.participants || []).includes(agent.id)}
                            className="mr-2"
                          />
                          <span>{agent.name}</span>
                          {agent.status && (
                            <Badge className={agent.status === 'available' ? 'bg-green-100 text-green-800 ml-2' : 'bg-gray-100 text-gray-800 ml-2'}>
                              {agent.status}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          {errors.participants && <FormMessage>{errors.participants}</FormMessage>}
        </FormField>

        <FormField>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emergency"
              checked={!!data.is_emergency}
              onCheckedChange={checked => setData('is_emergency', Boolean(checked))}
            />
            <label
              htmlFor="emergency"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mark as Emergency Communication
            </label>
          </div>
        </FormField>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={processing} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
            Create Conversation
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewConversationForm;
