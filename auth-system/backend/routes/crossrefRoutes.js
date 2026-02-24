const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// Crossref Deposit Endpoint Handler
router.post('/deposit', async (req, res) => {
    try {
        const { xmlContent, login_id, login_passwd } = req.body;

        if (!xmlContent || !login_id || !login_passwd) {
            return res.status(400).json({ message: 'Missing required fields: xmlContent, login_id, login_passwd' });
        }

        // According to Crossref documentation, this endpoint is used for deposits:
        // https://doi.crossref.org/servlet/deposit
        // Use test endpoint if process.env.CROSSREF_ENV === 'test' or similar, but default to production
        const crossrefUrl = process.env.CROSSREF_URL || 'https://test.crossref.org/servlet/deposit';

        const form = new FormData();
        form.append('operation', 'doMDUpload');
        form.append('login_id', login_id);
        form.append('login_passwd', login_passwd);

        // We append the XML content as a file named metadata.xml
        form.append('fname', Buffer.from(xmlContent, 'utf-8'), {
            filename: 'metadata.xml',
            contentType: 'application/xml',
        });

        // Make the POST request to Crossref
        const response = await axios.post(crossrefUrl, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // The response from Crossref usually contains an HTML status/XML 
        // We can parse or return it directly.
        // It provides a submission_id somewhere inside.
        const responseData = response.data;
        let submissionId = null;

        // Try to quickly extract submission id if possible from text output
        const match = responseData.match(/name="submission_id" value="([^"]+)"/);
        if (match && match[1]) {
            submissionId = match[1];
        }

        return res.status(200).json({
            success: true,
            submission_id: submissionId,
            message: 'Successfully sent to Crossref',
            raw_response: responseData
        });

    } catch (error) {
        console.error('Error proxying to Crossref:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error communicating with Crossref server',
            error: error.response?.data || error.message
        });
    }
});

module.exports = router;
