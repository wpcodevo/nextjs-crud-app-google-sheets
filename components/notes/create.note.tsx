'use client';

import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import { date, object, string, TypeOf } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoadingButton } from '../LoadingButton';
import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NProgress from 'nprogress';
import { appendSpreadsheetData } from '@/app/note-api';
import { INote } from '@/app/types';

type ICreateNoteProps = {
  setOpenNoteModal: (open: boolean) => void;
};

const createNoteSchema = object({
  title: string().min(1, 'Title is required'),
  content: string().min(1, 'Content is required'),
});

export type CreateNoteInput = TypeOf<typeof createNoteSchema>;

const CreateNote: FC<ICreateNoteProps> = ({ setOpenNoteModal }) => {
  const methods = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const queryClient = useQueryClient();

  const { mutate: createNote } = useMutation({
    mutationFn: (note: (string | string | string | string | string)[]) =>
      appendSpreadsheetData(note),
    onMutate() {
      NProgress.start();
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: ['getNotes'],
        refetchType: 'active',
      });
      setOpenNoteModal(false);
      NProgress.done();
      toast('Note created successfully', {
        type: 'success',
        position: 'top-right',
      });
    },
    onError(error: any) {
      setOpenNoteModal(false);
      NProgress.done();
      const resMessage =
        error.response.data.message ||
        error.response.data.detail ||
        error.message ||
        error.toString();
      toast(resMessage, {
        type: 'error',
        position: 'top-right',
      });
    },
  });

  function generateUUID() {
    // Generate a random hexadecimal string of length 8
    const s4 = () =>
      Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(0, 8);
    // Return a UUID string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return `${s4()}${s4()}-${s4()}-4${s4().substring(
      0,
      3
    )}-${s4()}-${s4()}${s4()}${s4()}`.toLowerCase();
  }

  const onSubmitHandler: SubmitHandler<CreateNoteInput> = async (data) => {
    const note: INote = {
      id: generateUUID(),
      title: data.title,
      content: data.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    createNote([
      note.id,
      note.title,
      note.content,
      note.createdAt.toISOString(),
      note.updatedAt.toISOString(),
    ]);
  };
  return (
    <section>
      <div className='flex justify-between items-center mb-3 pb-3 border-b border-gray-200'>
        <h2 className='text-2xl text-ct-dark-600 font-semibold'>Create Note</h2>
        <div
          onClick={() => setOpenNoteModal(false)}
          className='text-2xl text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 ml-auto inline-flex items-center cursor-pointer'
        >
          <i className='bx bx-x'></i>
        </div>
      </div>
      <form className='w-full' onSubmit={handleSubmit(onSubmitHandler)}>
        <div className='mb-2'>
          <label className='block text-gray-700 text-lg mb-2' htmlFor='title'>
            Title
          </label>
          <input
            className={twMerge(
              `appearance-none border border-gray-400 rounded w-full py-3 px-3 text-gray-700 mb-2  leading-tight focus:outline-none`,
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
              `appearance-none border border-gray-400 rounded w-full py-3 px-3 text-gray-700 mb-2 leading-tight focus:outline-none`,
              `${errors.content && 'border-red-500'}`
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
        <LoadingButton loading={false}>Create Note</LoadingButton>
      </form>
    </section>
  );
};

export default CreateNote;
