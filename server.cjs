const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Support both raw JSON and URL-encoded form data payloads from n8n workflows
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => { console.log('BODY RECEIVED:', req.body); next(); });

const BASE_DIR = '/tmp/hyperframes-jobs';
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });

// 1. Endpoint for n8n to submit the AI-generated HTML overlay code
app.post('/render', (req, res) => {
    const jobId = crypto.randomUUID();
    const projectDir = path.join(BASE_DIR, jobId);
    fs.mkdirSync(projectDir, { recursive: true });

    const htmlContent = req.body?.html || "<html><body><h1>No Overlay Content</h1></body></html>";
    fs.writeFileSync(path.join(projectDir, 'index.html'), htmlContent);

    const renderCmd = `npx hyperframes render --quality draft --output output.mp4`;

    exec(renderCmd, { cwd: projectDir }, (error, stdout, stderr) => {
        console.log('RENDER STDOUT:', stdout);
        console.log('RENDER STDERR:', stderr);
        if (error) {
            console.log('RENDER ERROR:', error.message);
            fs.writeFileSync(path.join(projectDir, 'status.txt'), `failed: ${error.message}`);
            return;
        }
        fs.writeFileSync(path.join(projectDir, 'status.txt'), 'completed');
    });

    res.json({
        job_id: jobId,
        status: "processing",
        status_url: `https://${req.get('host')}/status/${jobId}`
    });
});

// Health check route for cron-job.org uptime pings
app.get('/', (req, res) => {
    res.status(200).send("HyperFrames Engine Online");
});

// 2. Updated Status Endpoint (ALWAYS returns JSON)
app.get('/status/:jobId', (req, res) => {
    const projectDir = path.join(BASE_DIR, req.params.jobId);
    const videoFile = path.join(projectDir, 'output.mp4');
    const statusFile = path.join(projectDir, 'status.txt');

    if (!fs.existsSync(projectDir)) {
        return res.status(404).json({ status: "not_found" });
    }
    if (fs.existsSync(videoFile)) {
        return res.json({
            status: "completed",
            download_url: `https://${req.get('host')}/download/${req.params.jobId}`
        });
    }
    if (fs.existsSync(statusFile)) {
        const status = fs.readFileSync(statusFile, 'utf8');
        if (status.startsWith('failed')) return res.json({ status: "failed", error: status });
    }
    res.json({ status: "processing" });
});

// 3. New Dedicated Download Endpoint (ALWAYS returns the File binary)
app.get('/download/:jobId', (req, res) => {
    const videoFile = path.join(BASE_DIR, req.params.jobId, 'output.mp4');
    if (fs.existsSync(videoFile)) {
        return res.sendFile(videoFile);
    }
    res.status(404).send("File not ready or expired");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HyperFrames Cloud Bridge active on port ${PORT}`));
