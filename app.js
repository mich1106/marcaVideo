import express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import multer from 'multer';
import { Worker, isMainThread, workerData } from 'worker_threads';

require('dotenv').config();

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({dest: 'uploads', storage: storage});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    res.render('index')
});

app.post('/upload-video', upload.single('ssvideo'), (req, res) => {
    if(isMainThread){

        let thread = new Worker('./threads/worker.js', { 
            workerData: {
                file: req.file.path,
                filename: req.file.filename
            } 
        });

        thread.on('message', data => {
            res.download(data.file, req.file.filename);
        });

        thread.on('error', err => {
            console.log('Error en el thread', err);
        });

        thread.on('exit', code =>{
            if(code != 0){
                console.log(`El hilo se detuvo con el codigo de salida ${code}`);
            }
        });
    }

});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`El servidor se inicio en el puerto ${PORT}`);
});