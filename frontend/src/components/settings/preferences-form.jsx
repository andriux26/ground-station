/**
 * @license
 * Copyright (c) 2025 Efstratios Goudelis
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updatePreferences, setPreference } from './preferences-slice.jsx';
import { tz } from 'moment-timezone';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    AlertTitle,
    Backdrop,
    Box,
    Button,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSocket } from "../common/socket.jsx";
import { toast } from '../../utils/toast-with-timestamp.jsx';
import { getAvailableThemesWithMetadata } from '../../themes/theme-configs.js';

const PreferencesForm = () => {
    const { socket } = useSocket();
    const dispatch = useDispatch();
    const { preferences, status } = useSelector((state) => state.preferences);
    const isLoading = status === 'loading';
    const { t, i18n } = useTranslation('settings');
    const [themeChanged, setThemeChanged] = useState(false);
    const [originalTheme, setOriginalTheme] = useState('');
    const [localThemeValue, setLocalThemeValue] = useState('');
    const [reloading, setReloading] = useState(false);

    useEffect(() => {
        const themeValue = getPreferenceValue('theme');
        if (themeValue && !originalTheme) {
            setOriginalTheme(themeValue);
            setLocalThemeValue(themeValue);
        }
    }, [preferences]);

    const getPreferenceValue = (name) => {
        const preference = preferences.find((pref) => pref.name === name);
        return preference ? preference.value : '';
    };

    const timezoneOptions = tz.names().map((zone) => ({
        name: zone.replace('_', ' '),
        value: zone,
    }));

    const languageOptions = [
        { name: 'English', value: 'en_US' },
        { name: 'Lietuvių', value: 'lt_LT' },
        { name: 'Ελληνικά', value: 'el_GR' },
        { name: 'Français', value: 'fr_FR' },
        { name: 'Español', value: 'es_ES' },
        { name: 'Deutsch', value: 'de_DE' },
        { name: 'Italiano', value: 'it_IT' },
        { name: 'Nederlands', value: 'nl_NL' },
    ];

    const toastPositionOptions = [
        { name: t('preferences.toast_position_top_left'), value: 'top-left' },
        { name: t('preferences.toast_position_top_center'), value: 'top-center' },
        { name: t('preferences.toast_position_top_right'), value: 'top-right' },
        { name: t('preferences.toast_position_bottom_left'), value: 'bottom-left' },
        { name: t('preferences.toast_position_bottom_center'), value: 'bottom-center' },
        { name: t('preferences.toast_position_bottom_right'), value: 'bottom-right' },
    ];

    const themesOptions = getAvailableThemesWithMetadata();

    const handleChange = (name) => (e) => {
        const value = e.target.value;

        if (name === 'theme') {
            setLocalThemeValue(value);
            if (value !== originalTheme) {
                setThemeChanged(true);
            } else {
                setThemeChanged(false);
            }
            return;
        }

        dispatch(setPreference({ name, value }));

        if (name === 'language') {
            const languageCode = value.split('_')[0];
            i18n.changeLanguage(languageCode);
        }
    };

    const handleSavePreferences = () => {
        if (themeChanged) {
            dispatch(setPreference({ name: 'theme', value: localThemeValue }));
        }

        dispatch(updatePreferences({ socket }))
            .unwrap()
            .then(() => {
                toast.success(t('preferences.save_success'));

                if (themeChanged) {
                    setReloading(true);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            })
            .catch(() => {
                toast.error(t('preferences.save_error'));
            });
    };

    return (
        <>
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}
                open={reloading}
            >
                <CircularProgress color="inherit" />
                <Typography variant="h6">
                    {t('preferences.reloading', 'Perkraunama...')}
                </Typography>
            </Backdrop>

            <Paper elevation={3} sx={{ padding: 2, marginTop: 0 }}>
                <Alert severity="info">
                    <AlertTitle>{t('preferences.title')}</AlertTitle>
                    {t('preferences.subtitle')}
                </Alert>

                <Box component="form" sx={{ mt: 2 }}>
                    <Grid container spacing={3} columns={16}>
                        <Grid size={16}>
                            <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
                                {t('general')}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.timezone')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <FormControl
                                sx={{ minWidth: 200, marginTop: 1, marginBottom: 1 }}
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                size="small"
                            >
                                <InputLabel>{t('preferences.timezone')}</InputLabel>
                                <Select
                                    value={getPreferenceValue('timezone')}
                                    onChange={handleChange('timezone')}
                                    label={t('preferences.timezone')}
                                    size="small"
                                >
                                    {timezoneOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.locale', 'Lokalė (formatavimas)')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <FormControl
                                sx={{ minWidth: 200, marginTop: 1, marginBottom: 1 }}
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                size="small"
                            >
                                <InputLabel>{t('preferences.locale', 'Lokalė')}</InputLabel>
                                <Select
                                    value={getPreferenceValue('locale') || 'browser'}
                                    onChange={handleChange('locale')}
                                    label={t('preferences.locale', 'Lokalė')}
                                    size="small"
                                >
                                    <MenuItem value="browser">
                                        {t('preferences.locale_browser_default', 'Numatytoji naršyklės')} ({navigator.language})
                                    </MenuItem>
                                    <MenuItem value="en-US">English (United States)</MenuItem>
                                    <MenuItem value="en-GB">English (United Kingdom)</MenuItem>
                                    <MenuItem value="lt-LT">Lietuvių (Lietuva)</MenuItem>
                                    <MenuItem value="el-GR">Ελληνικά (Greek)</MenuItem>
                                    <MenuItem value="de-DE">Deutsch (German)</MenuItem>
                                    <MenuItem value="fr-FR">Français (French)</MenuItem>
                                    <MenuItem value="es-ES">Español (Spanish)</MenuItem>
                                    <MenuItem value="it-IT">Italiano (Italian)</MenuItem>
                                    <MenuItem value="nl-NL">Nederlands (Dutch)</MenuItem>
                                    <MenuItem value="pt-PT">Português (Portuguese)</MenuItem>
                                    <MenuItem value="ru-RU">Русский (Russian)</MenuItem>
                                    <MenuItem value="ja-JP">日本語 (Japanese)</MenuItem>
                                    <MenuItem value="zh-CN">中文 (Chinese Simplified)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.language')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <FormControl
                                sx={{ minWidth: 200, marginTop: 1, marginBottom: 1 }}
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                size="small"
                            >
                                <InputLabel>{t('preferences.language')}</InputLabel>
                                <Select
                                    value={getPreferenceValue('language')}
                                    onChange={handleChange('language')}
                                    label={t('preferences.language')}
                                    size="small"
                                >
                                    {languageOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.theme')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <FormControl
                                sx={{ minWidth: 200, marginTop: 1, marginBottom: 1 }}
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                size="small"
                            >
                                <InputLabel htmlFor={"theme-selector"}>{t('preferences.theme')}</InputLabel>
                                <Select
                                    id={'theme-selector'}
                                    value={localThemeValue || getPreferenceValue('theme')}
                                    onChange={handleChange('theme')}
                                    label={t('preferences.theme')}
                                    size="small"
                                >
                                    {themesOptions.map((option) => (
                                        <MenuItem key={option.id} value={option.id}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {themeChanged && (
                                <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                                    {t('preferences.theme_reload_required', 'Tema bus pritaikyta po išsaugojimo ir perkrovimo')}
                                </Alert>
                            )}
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.toast_position')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <FormControl
                                sx={{ minWidth: 200, marginTop: 1, marginBottom: 1 }}
                                fullWidth
                                variant="outlined"
                                disabled={isLoading}
                                size="small"
                            >
                                <InputLabel htmlFor={"toast-position-selector"}>
                                    {t('preferences.toast_position')}
                                </InputLabel>
                                <Select
                                    id={'toast-position-selector'}
                                    value={getPreferenceValue('toast_position')}
                                    onChange={handleChange('toast_position')}
                                    label={t('preferences.toast_position')}
                                    size="small"
                                >
                                    {toastPositionOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={16} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
                                {t('preferences.api_configuration')}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.stadia_maps_api_key')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <TextField
                                fullWidth
                                id="stadia-api-key"
                                variant="outlined"
                                type="text"
                                size="small"
                                disabled={isLoading}
                                label={t('preferences.stadia_maps_api_key')}
                                value={getPreferenceValue('stadia_maps_api_key')}
                                onChange={handleChange('stadia_maps_api_key')}
                                sx={{
                                    marginTop: 1,
                                    marginBottom: 1,
                                    '& .MuiInputBase-root': {
                                        backgroundColor: 'transparent'
                                    }
                                }}
                            />
                        </Grid>

                        <Grid size={16} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
                                {t('preferences.debabel_configuration', 'Transkripcija')}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.gemini_api_key', 'Gemini API raktas')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <Box sx={{ backgroundColor: 'transparent' }}>
                                <TextField
                                    style={{ fontFamily: 'monospace' }}
                                    fullWidth
                                    id="gemini-api-key"
                                    variant="outlined"
                                    type="text"
                                    size="small"
                                    disabled={isLoading}
                                    label={t('preferences.gemini_api_key', 'Gemini API raktas')}
                                    placeholder="AIza..."
                                    value={getPreferenceValue('gemini_api_key')}
                                    onChange={handleChange('gemini_api_key')}
                                    slotProps={{
                                        formHelperText: {
                                            sx: {
                                                marginLeft: 0,
                                                marginRight: 0,
                                                backgroundColor: 'transparent'
                                            }
                                        }
                                    }}
                                    autoComplete="off"
                                    inputProps={{
                                        autoComplete: 'off',
                                        'data-form-type': 'other',
                                        'data-lpignore': 'true'
                                    }}
                                    sx={{
                                        marginTop: 1,
                                        marginBottom: 0,
                                        '& .MuiInputBase-root': {
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', mt: '3px', ml: '14px', mr: '14px', color: 'text.secondary' }}
                                >
                                    {t('preferences.gemini_api_key_help', 'Google Gemini API raktas garso transkripcijai. Gausite ai.google.dev')}
                                </Typography>
                            </Box>
                            <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                                <AlertTitle sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                    {t('preferences.privacy_terms', 'Privatumas ir sąlygos')}
                                </AlertTitle>
                                {t('preferences.gemini_privacy_notice', 'Kai įjungta, garsas siunčiamas į Google serverius. Už kaštus atsakote jūs (~$0.27/val.).')}
                                {' '}
                                <a
                                    href="https://ai.google.dev/gemini-api/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'underline' }}
                                >
                                    {t('preferences.google_terms', 'Google sąlygos')}
                                </a>
                                {' • '}
                                <a
                                    href="https://github.com/sgoudelis/ground-station/blob/main/TRANSCRIPTION_PRIVACY.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'underline' }}
                                >
                                    {t('preferences.privacy_notice', 'Privatumo pranešimas')}
                                </a>
                            </Alert>
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.deepgram_api_key', 'Deepgram API raktas')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <Box sx={{ backgroundColor: 'transparent' }}>
                                <TextField
                                    style={{ fontFamily: 'monospace' }}
                                    fullWidth
                                    id="deepgram-api-key"
                                    variant="outlined"
                                    type="text"
                                    size="small"
                                    disabled={isLoading}
                                    label={t('preferences.deepgram_api_key', 'Deepgram API raktas')}
                                    placeholder="..."
                                    value={getPreferenceValue('deepgram_api_key')}
                                    onChange={handleChange('deepgram_api_key')}
                                    autoComplete="off"
                                    inputProps={{
                                        autoComplete: 'off',
                                        'data-form-type': 'other',
                                        'data-lpignore': 'true'
                                    }}
                                    sx={{
                                        marginTop: 1,
                                        marginBottom: 0,
                                        '& .MuiInputBase-root': {
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', mt: '3px', ml: '14px', mr: '14px', color: 'text.secondary' }}
                                >
                                    {t('preferences.deepgram_api_key_help', 'Deepgram API raktas garso transkripcijai. Gausite deepgram.com')}
                                </Typography>
                            </Box>
                            <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                                <AlertTitle sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                    {t('preferences.privacy_terms', 'Privatumas ir sąlygos')}
                                </AlertTitle>
                                {t('preferences.deepgram_privacy_notice', 'Kai įjungta, garsas siunčiamas į Deepgram serverius. Už kaštus atsakote jūs (~$0.015/val.).')}
                                {' '}
                                <a
                                    href="https://deepgram.com/pricing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'underline' }}
                                >
                                    {t('preferences.deepgram_pricing', 'Deepgram kainos')}
                                </a>
                                {' • '}
                                <a
                                    href="https://github.com/sgoudelis/ground-station/blob/main/TRANSCRIPTION_PRIVACY.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'underline' }}
                                >
                                    {t('preferences.privacy_notice', 'Privatumo pranešimas')}
                                </a>
                            </Alert>
                        </Grid>

                        <Grid size={8} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography>{t('preferences.google_translate_api_key', 'Google Translate API raktas')}</Typography>
                        </Grid>
                        <Grid size={8}>
                            <Box sx={{ backgroundColor: 'transparent' }}>
                                <TextField
                                    style={{ fontFamily: 'monospace' }}
                                    fullWidth
                                    id="google-translate-api-key"
                                    variant="outlined"
                                    type="text"
                                    size="small"
                                    disabled={isLoading}
                                    label={t('preferences.google_translate_api_key', 'Google Translate API raktas')}
                                    placeholder="AIza..."
                                    value={getPreferenceValue('google_translate_api_key')}
                                    onChange={handleChange('google_translate_api_key')}
                                    autoComplete="off"
                                    inputProps={{
                                        autoComplete: 'off',
                                        'data-form-type': 'other',
                                        'data-lpignore': 'true'
                                    }}
                                    sx={{
                                        marginTop: 1,
                                        marginBottom: 0,
                                        '& .MuiInputBase-root': {
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', mt: '3px', ml: '14px', mr: '14px', color: 'text.secondary' }}
                                >
                                    {t('preferences.google_translate_api_key_help', 'Google Cloud Translation API raktas Deepgram transkripcijų vertimui. Gausite cloud.google.com')}
                                </Typography>
                            </Box>
                            <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                                <AlertTitle sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                    {t('preferences.privacy_terms', 'Privatumas ir sąlygos')}
                                </AlertTitle>
                                {t('preferences.translate_privacy_notice', 'Naudojama Deepgram transkripcijų vertimui. Tekstas siunčiamas į Google serverius. Kainos: cloud.google.com/translate/pricing.')}
                                {' '}
                                <a
                                    href="https://cloud.google.com/translate/pricing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'underline' }}
                                >
                                    {t('preferences.google_translate_pricing', 'Google Translate kainos')}
                                </a>
                            </Alert>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            disabled={isLoading}
                            variant="contained"
                            color="primary"
                            onClick={handleSavePreferences}
                        >
                            {t('preferences.save_preferences')}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </>
    );
};

export default PreferencesForm;
