// export const TryCatch = (func) => {
//   return (req, res, next) => {
//     return Promise.resolve(func(req, res, next)).catch(next);
//   };
// };


export const TryCatch = (func) => {
    return (req, res, next) => {
        return Promise.resolve(func(req, res, next)).catch(next);
    };
};