import router from './routes/index';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.use(express.json());
app.use('/', router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
