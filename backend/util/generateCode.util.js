// Creates codes like CU-1001, OR-1002 based on how many documents exist
const generateCode = async (Model, prefix) => {
    const count = await Model.countDocuments();
    return `${prefix}-${1001 + count}`;
  };
  
  module.exports = generateCode;