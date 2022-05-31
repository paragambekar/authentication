if(process.env.NODE_ENV !== 'porduction'){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const port = process.env.PORT;


app.listen(port, function(error){
    if(error){
        console.log(`Error in running server on port ${port}`);
        return;
    }

    console.log(`Server is running on port ${port}`);
});

