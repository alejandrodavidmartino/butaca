export default function ErrorMessage({ message }) {
  return (
    <div className="mx-auto my-16 max-w-md rounded-xl border border-butaca-500/30 bg-butaca-500/10 p-6 text-center">
      <p className="text-3xl">🎞️</p>
      <p className="mt-2 text-red-200">{message}</p>
    </div>
  );
}
