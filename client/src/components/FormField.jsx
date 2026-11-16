// Campo de formulario reutilizable con etiqueta
export default function FormField({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      <input id={id} name={id} className="input" {...props} />
    </div>
  );
}
