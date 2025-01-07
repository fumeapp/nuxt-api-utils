export default defineEventHandler((_event) => {
  return metapi().render([1, 2, 3])
})
