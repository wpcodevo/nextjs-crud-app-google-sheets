'use client';

import { FC, useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import { object, string, TypeOf } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '../LoadingButton';
import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { INote } from '@/app/types';
import { updateSpreadsheetData } from '@/app/note-api';

type IUpdateNoteProps = {
  note: INote;
  setOpenNoteModal: (open: boolean) => void;
  notes: INote[];
};

const updateNoteSchema = object({
  title: string().min(1, 'Title is required'),
  content: string().min(1, 'Content is required'),
});

export type UpdateNoteInput = TypeOf<typeof updateNoteSchema>;

const UpdateNote: FC<IUpdateNoteProps> = ({
  note,
  setOpenNoteModal,
  notes,
}) => {
  const methods = useForm<UpdateNoteInput>({
    resolver: zodResolver(updateNoteSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (note) {
      methods.reset(note);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateNoteFn = async (
    id: string,
    data: UpdateNoteInput
  ): Promise<INote[]> => {
    notes.map((p, index) => {
      if (p.id === id) {
        updateSpreadsheetData(index, [
          p.id,
          data.title,
          data.content,
          p.createdAt.toISOString(),
          new Date().toISOString(),
        ]);
        return p;
      } else return p;
    });

    return [];
  };

  const queryClient = useQueryClient();
  const { mutate: updateNote } = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: UpdateNoteInput }) =>
      updateNoteFn(noteId, data),

    onMutate: async ({ noteId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['getNotes'] });

      const previousNotes = queryClient.getQueryData<INote[]>(['getNotes']);

      queryClient.setQueryData<INote[]>(['getNotes'], (oldNotes) =>
        oldNotes?.map((note) =>
          note.id === noteId ? { ...note, ...data } : note
        )
      );

      return { previousNotes };
    },

    onError: (error: any, { noteId }, context) => {
      queryClient.setQueryData(['getNotes'], context?.previousNotes);
      setOpenNoteModal(false);

      const resMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        error.toString();
      toast(resMessage, {
        type: 'error',
        position: 'top-right',
      });
    },

    onSuccess: () => {
      setOpenNoteModal(false);
      toast('Note updated successfully', {
        type: 'success',
        position: 'top-right',
      });
    },
  });

  const onSubmitHandler: SubmitHandler<UpdateNoteInput> = async (data) => {
    updateNote({ noteId: note.id, data });
  };
  return (
    <section>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-2xl text-ct-dark-600 font-semibold'>Update Note</h2>
        <div
          onClick={() => setOpenNoteModal(false)}
          className='text-2xl text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 ml-auto inline-flex items-center cursor-pointer'
        >
          <i className='bx bx-x'></i>
        </div>
      </div>{' '}
      <form className='w-full' onSubmit={handleSubmit(onSubmitHandler)}>
        <div className='mb-2'>
          <label className='block text-gray-700 text-lg mb-2' htmlFor='title'>
            Title
          </label>
          <input
            className={twMerge(
              `appearance-none border border-gray-400 rounded w-full py-3 px-3 text-gray-700 mb-2 leading-tight focus:outline-none`,
              `${errors['title'] && 'border-red-500'}`
            )}
            {...methods.register('title')}
          />
          <p
            className={twMerge(
              `text-red-500 text-xs italic mb-2 invisible`,
              `${errors['title'] && 'visible'}`
            )}
          >
            {errors['title']?.message as string}
          </p>
        </div>
        <div className='mb-2'>
          <label className='block text-gray-700 text-lg mb-2' htmlFor='title'>
            Content
          </label>
          <textarea
            className={twMerge(
              `appearance-none border rounded w-full py-3 px-3 text-gray-700 mb-2 leading-tight focus:outline-none`,
              `${errors.content ? 'border-red-500' : 'border-gray-400'}`
            )}
            rows={6}
            {...register('content')}
          />
          <p
            className={twMerge(
              `text-red-500 text-xs italic mb-2`,
              `${errors.content ? 'visible' : 'invisible'}`
            )}
          >
            {errors.content && errors.content.message}
          </p>
        </div>
        <LoadingButton loading={false}>Update Note</LoadingButton>
      </form>
    </section>
  );
};

export default UpdateNote;
